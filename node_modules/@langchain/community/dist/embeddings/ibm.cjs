const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');
const require_ibm = require('../utils/ibm.cjs');
const __langchain_core_utils_async_caller = require_rolldown_runtime.__toESM(require("@langchain/core/utils/async_caller"));
const __langchain_core_embeddings = require_rolldown_runtime.__toESM(require("@langchain/core/embeddings"));

//#region src/embeddings/ibm.ts
var ibm_exports = {};
require_rolldown_runtime.__export(ibm_exports, { WatsonxEmbeddings: () => WatsonxEmbeddings });
var WatsonxEmbeddings = class extends __langchain_core_embeddings.Embeddings {
	model;
	serviceUrl;
	version;
	spaceId;
	projectId;
	truncateInputTokens;
	maxRetries;
	maxConcurrency;
	service;
	constructor(fields) {
		const superProps = {
			maxConcurrency: 2,
			...fields
		};
		super(superProps);
		this.model = fields.model;
		this.version = fields.version;
		this.serviceUrl = fields.serviceUrl;
		this.truncateInputTokens = fields.truncateInputTokens;
		this.maxConcurrency = fields.maxConcurrency;
		this.maxRetries = fields.maxRetries ?? 0;
		if (fields.projectId && fields.spaceId) throw new Error("Maximum 1 id type can be specified per instance");
		else if (!fields.projectId && !fields.spaceId) throw new Error("No id specified! At least id of 1 type has to be specified");
		this.projectId = fields?.projectId;
		this.spaceId = fields?.spaceId;
		this.serviceUrl = fields?.serviceUrl;
		const { watsonxAIApikey, watsonxAIAuthType, watsonxAIBearerToken, watsonxAIUsername, watsonxAIPassword, watsonxAIUrl, disableSSL, version, serviceUrl } = fields;
		const auth = require_ibm.authenticateAndSetInstance({
			watsonxAIApikey,
			watsonxAIAuthType,
			watsonxAIBearerToken,
			watsonxAIUsername,
			watsonxAIPassword,
			watsonxAIUrl,
			disableSSL,
			version,
			serviceUrl
		});
		if (auth) this.service = auth;
		else throw new Error("You have not provided one type of authentication");
	}
	scopeId() {
		if (this.projectId) return {
			projectId: this.projectId,
			modelId: this.model
		};
		else return {
			spaceId: this.spaceId,
			modelId: this.model
		};
	}
	invocationParams() {
		return { truncate_input_tokens: this.truncateInputTokens };
	}
	async listModels() {
		const listModelParams = { filters: "function_embedding" };
		const caller = new __langchain_core_utils_async_caller.AsyncCaller({
			maxConcurrency: this.maxConcurrency,
			maxRetries: this.maxRetries
		});
		const listModels = await caller.call(() => this.service.listFoundationModelSpecs(listModelParams));
		return listModels.result.resources?.map((item) => item.model_id);
	}
	async embedSingleText(inputs) {
		const textEmbeddingParams = {
			inputs,
			...this.scopeId(),
			parameters: this.invocationParams()
		};
		const caller = new __langchain_core_utils_async_caller.AsyncCaller({
			maxConcurrency: this.maxConcurrency,
			maxRetries: this.maxRetries
		});
		const embeddings = await caller.call(() => this.service.embedText(textEmbeddingParams));
		return embeddings.result.results.map((item) => item.embedding);
	}
	async embedDocuments(documents) {
		const data = await this.embedSingleText(documents);
		return data;
	}
	async embedQuery(document) {
		const data = await this.embedSingleText([document]);
		return data[0];
	}
};

//#endregion
exports.WatsonxEmbeddings = WatsonxEmbeddings;
Object.defineProperty(exports, 'ibm_exports', {
  enumerable: true,
  get: function () {
    return ibm_exports;
  }
});
//# sourceMappingURL=ibm.cjs.map