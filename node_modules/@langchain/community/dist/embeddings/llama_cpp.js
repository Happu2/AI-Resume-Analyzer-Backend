import { __export } from "../_virtual/rolldown_runtime.js";
import { createLlamaContext, createLlamaModel } from "../utils/llama_cpp.js";
import { getLlama } from "node-llama-cpp";
import { Embeddings } from "@langchain/core/embeddings";

//#region src/embeddings/llama_cpp.ts
var llama_cpp_exports = {};
__export(llama_cpp_exports, { LlamaCppEmbeddings: () => LlamaCppEmbeddings });
/**
* @example
* ```typescript
* // Initialize LlamaCppEmbeddings with the path to the model file
* const embeddings = await LlamaCppEmbeddings.initialize({
*   modelPath: llamaPath,
* });
*
* // Embed a query string using the Llama embeddings
* const res = embeddings.embedQuery("Hello Llama!");
*
* // Output the resulting embeddings
* console.log(res);
*
* ```
*/
var LlamaCppEmbeddings = class LlamaCppEmbeddings extends Embeddings {
	_model;
	_context;
	constructor(inputs) {
		super(inputs);
		const _inputs = inputs;
		_inputs.embedding = true;
	}
	/**
	* Initializes the llama_cpp model for usage in the embeddings wrapper.
	* @param inputs - the inputs passed onto the model.
	* @returns A Promise that resolves to the LlamaCppEmbeddings type class.
	*/
	static async initialize(inputs) {
		const instance = new LlamaCppEmbeddings(inputs);
		const llama = await getLlama();
		instance._model = await createLlamaModel(inputs, llama);
		instance._context = await createLlamaContext(instance._model, inputs);
		return instance;
	}
	/**
	* Generates embeddings for an array of texts.
	* @param texts - An array of strings to generate embeddings for.
	* @returns A Promise that resolves to an array of embeddings.
	*/
	async embedDocuments(texts) {
		const tokensArray = [];
		for (const text of texts) {
			const encodings = await this.caller.call(() => new Promise((resolve) => {
				resolve(this._model.tokenize(text));
			}));
			tokensArray.push(encodings);
		}
		const embeddings = [];
		for (const tokens of tokensArray) {
			const embedArray = [];
			for (let i = 0; i < tokens.length; i += 1) {
				const nToken = +tokens[i];
				embedArray.push(nToken);
			}
			embeddings.push(embedArray);
		}
		return embeddings;
	}
	/**
	* Generates an embedding for a single text.
	* @param text - A string to generate an embedding for.
	* @returns A Promise that resolves to an array of numbers representing the embedding.
	*/
	async embedQuery(text) {
		const tokens = [];
		const encodings = await this.caller.call(() => new Promise((resolve) => {
			resolve(this._model.tokenize(text));
		}));
		for (let i = 0; i < encodings.length; i += 1) {
			const token = +encodings[i];
			tokens.push(token);
		}
		return tokens;
	}
};

//#endregion
export { LlamaCppEmbeddings, llama_cpp_exports };
//# sourceMappingURL=llama_cpp.js.map