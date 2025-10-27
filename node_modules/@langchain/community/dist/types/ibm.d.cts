import { RequestCallbacks } from "@ibm-cloud/watsonx-ai/dist/watsonx-ai-ml/vml_v1.js";

//#region src/types/ibm.d.ts

interface WatsonxAuth {
  watsonxAIApikey?: string;
  watsonxAIBearerToken?: string;
  watsonxAIUsername?: string;
  watsonxAIPassword?: string;
  watsonxAIUrl?: string;
  watsonxAIAuthType?: string;
  disableSSL?: boolean;
}
interface WatsonxInit {
  authenticator?: string;
  serviceUrl: string;
  version: string;
}
interface WatsonxChatBasicOptions {
  maxConcurrency?: number;
  maxRetries?: number;
  streaming?: boolean;
  watsonxCallbacks?: RequestCallbacks;
}
interface WatsonxParams extends WatsonxInit, WatsonxChatBasicOptions {
  model: string;
  spaceId?: string;
  projectId?: string;
}
type Neverify<T> = { [K in keyof T]?: never };
interface WatsonxDeployedParams extends WatsonxInit, WatsonxChatBasicOptions {
  idOrName?: string;
}
//#endregion
export { Neverify, WatsonxAuth, WatsonxChatBasicOptions, WatsonxDeployedParams, WatsonxInit, WatsonxParams };
//# sourceMappingURL=ibm.d.cts.map