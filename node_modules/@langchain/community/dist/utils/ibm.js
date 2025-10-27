import { JsonOutputToolsParser } from "@langchain/core/output_parsers/openai_tools";
import { OutputParserException } from "@langchain/core/output_parsers";
import { interopSafeParseAsync } from "@langchain/core/utils/types";
import { WatsonXAI } from "@ibm-cloud/watsonx-ai";
import { BearerTokenAuthenticator, CloudPakForDataAuthenticator, IamAuthenticator } from "ibm-cloud-sdk-core";
import { z } from "zod/v3";

//#region src/utils/ibm.ts
const authenticateAndSetInstance = ({ watsonxAIApikey, watsonxAIAuthType, watsonxAIBearerToken, watsonxAIUsername, watsonxAIPassword, watsonxAIUrl, disableSSL, version, serviceUrl }) => {
	if (watsonxAIAuthType === "iam" && watsonxAIApikey) return WatsonXAI.newInstance({
		version,
		serviceUrl,
		authenticator: new IamAuthenticator({ apikey: watsonxAIApikey })
	});
	else if (watsonxAIAuthType === "bearertoken" && watsonxAIBearerToken) return WatsonXAI.newInstance({
		version,
		serviceUrl,
		authenticator: new BearerTokenAuthenticator({ bearerToken: watsonxAIBearerToken })
	});
	else if (watsonxAIAuthType === "cp4d") {
		if (watsonxAIUsername && (watsonxAIPassword || watsonxAIApikey)) {
			const watsonxCPDAuthUrl = watsonxAIUrl ?? serviceUrl;
			return WatsonXAI.newInstance({
				version,
				serviceUrl,
				disableSslVerification: disableSSL,
				authenticator: new CloudPakForDataAuthenticator({
					username: watsonxAIUsername,
					password: watsonxAIPassword,
					url: watsonxCPDAuthUrl.concat("/icp4d-api/v1/authorize"),
					apikey: watsonxAIApikey,
					disableSslVerification: disableSSL
				})
			});
		}
	} else return WatsonXAI.newInstance({
		version,
		serviceUrl
	});
	return void 0;
};
const TOOL_CALL_ID_PATTERN = /^[a-zA-Z0-9]{9}$/;
function _isValidMistralToolCallId(toolCallId) {
	return TOOL_CALL_ID_PATTERN.test(toolCallId);
}
function _base62Encode(num) {
	let numCopy = num;
	const base62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	if (numCopy === 0) return base62[0];
	const arr = [];
	const base = 62;
	while (numCopy) {
		arr.push(base62[numCopy % base]);
		numCopy = Math.floor(numCopy / base);
	}
	return arr.reverse().join("");
}
function _simpleHash(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i += 1) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash &= hash;
	}
	return Math.abs(hash);
}
function _convertToolCallIdToMistralCompatible(toolCallId) {
	if (_isValidMistralToolCallId(toolCallId)) return toolCallId;
	else {
		const hash = _simpleHash(toolCallId);
		const base62Str = _base62Encode(hash);
		if (base62Str.length >= 9) return base62Str.slice(0, 9);
		else return base62Str.padStart(9, "0");
	}
}
var WatsonxToolsOutputParser = class extends JsonOutputToolsParser {
	static lc_name() {
		return "WatsonxToolsOutputParser";
	}
	lc_namespace = [
		"langchain",
		"watsonx",
		"output_parsers"
	];
	returnId = false;
	keyName;
	returnSingle = false;
	zodSchema;
	latestCorrect;
	constructor(params) {
		super(params);
		this.keyName = params.keyName;
		this.returnSingle = params.returnSingle ?? this.returnSingle;
		this.zodSchema = params.zodSchema;
	}
	async _validateResult(result) {
		let parsedResult = result;
		if (typeof result === "string") try {
			parsedResult = JSON.parse(result);
		} catch (e) {
			throw new OutputParserException(`Failed to parse. Text: "${JSON.stringify(result, null, 2)}". Error: ${JSON.stringify(e.message)}`, result);
		}
		else parsedResult = result;
		if (this.zodSchema === void 0) return parsedResult;
		const zodParsedResult = await interopSafeParseAsync(this.zodSchema, parsedResult);
		if (zodParsedResult.success) return zodParsedResult.data;
		else throw new OutputParserException(`Failed to parse. Text: "${JSON.stringify(result, null, 2)}". Error: ${JSON.stringify(zodParsedResult.error.issues)}`, JSON.stringify(result, null, 2));
	}
	async parsePartialResult(generations) {
		const tools = generations.flatMap((generation) => {
			const message = generation.message;
			if (!Array.isArray(message.tool_calls)) return [];
			const tool$1 = message.tool_calls;
			return tool$1;
		});
		if (tools[0] === void 0) if (this.latestCorrect) tools.push(this.latestCorrect);
		else {
			const toolCall = {
				name: "",
				args: {}
			};
			tools.push(toolCall);
		}
		const [tool] = tools;
		tool.name = "";
		this.latestCorrect = tool;
		return tool.args;
	}
};
function jsonSchemaToZod(obj) {
	if (obj?.properties && obj.type === "object") {
		const shape = {};
		Object.keys(obj.properties).forEach((key) => {
			if (obj.properties) {
				const prop = obj.properties[key];
				let zodType;
				if (prop.type === "string") {
					zodType = z.string();
					if (prop?.pattern) zodType = zodType.regex(prop.pattern, "Invalid pattern");
				} else if (prop.type === "number" || prop.type === "integer" || prop.type === "float") {
					zodType = z.number();
					if (typeof prop?.minimum === "number") zodType = zodType.min(prop.minimum, { message: `${key} must be at least ${prop.minimum}` });
					if (prop?.maximum) zodType = zodType.lte(prop.maximum, { message: `${key} must be maximum of ${prop.maximum}` });
				} else if (prop.type === "boolean") zodType = z.boolean();
				else if (prop.type === "array") zodType = z.array(jsonSchemaToZod(prop.items));
				else if (prop.type === "object") zodType = jsonSchemaToZod(prop);
				else throw new Error(`Unsupported type: ${prop.type}`);
				if (prop.description) zodType = zodType.describe(prop.description);
				if (!obj.required?.includes(key)) zodType = zodType.optional();
				shape[key] = zodType;
			}
		});
		return z.object(shape);
	}
	throw new Error("Unsupported root schema type");
}

//#endregion
export { WatsonxToolsOutputParser, _convertToolCallIdToMistralCompatible, authenticateAndSetInstance, jsonSchemaToZod };
//# sourceMappingURL=ibm.js.map