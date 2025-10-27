const require_rolldown_runtime = require('../../_virtual/rolldown_runtime.cjs');
const __langchain_core_documents = require_rolldown_runtime.__toESM(require("@langchain/core/documents"));
const __langchain_core_document_loaders_base = require_rolldown_runtime.__toESM(require("@langchain/core/document_loaders/base"));

//#region src/document_loaders/web/jira.ts
var jira_exports = {};
require_rolldown_runtime.__export(jira_exports, {
	JiraDocumentConverter: () => JiraDocumentConverter,
	JiraProjectLoader: () => JiraProjectLoader
});
/**
* Class responsible for converting Jira issues to Document objects
*/
var JiraDocumentConverter = class {
	host;
	projectKey;
	constructor({ host, projectKey }) {
		this.host = host;
		this.projectKey = projectKey;
	}
	convertToDocuments(issues) {
		return issues.map((issue) => this.documentFromIssue(issue));
	}
	documentFromIssue(issue) {
		return new __langchain_core_documents.Document({
			pageContent: this.formatIssueInfo({
				issue,
				host: this.host
			}),
			metadata: {
				id: issue.id,
				host: this.host,
				projectKey: this.projectKey
			}
		});
	}
	formatIssueInfo({ issue, host }) {
		let text = `Issue: ${this.formatMainIssueInfoText({
			issue,
			host
		})}\n`;
		text += `Project: ${issue.fields.project.name} (${issue.fields.project.key}, ID ${issue.fields.project.id})\n`;
		text += `Status: ${issue.fields.status.name}\n`;
		text += `Priority: ${issue.fields.priority.name}\n`;
		text += `Type: ${issue.fields.issuetype.name}\n`;
		text += `Creator: ${issue.fields.creator?.displayName}\n`;
		if (issue.fields.labels && issue.fields.labels.length > 0) text += `Labels: ${issue.fields.labels.join(", ")}\n`;
		text += `Created: ${issue.fields.created}\n`;
		text += `Updated: ${issue.fields.updated}\n`;
		if (issue.fields.reporter) text += `Reporter: ${issue.fields.reporter.displayName}\n`;
		text += `Assignee: ${issue.fields.assignee?.displayName ?? "Unassigned"}\n`;
		if (issue.fields.duedate) text += `Due Date: ${issue.fields.duedate}\n`;
		if (issue.fields.timeestimate) text += `Time Estimate: ${issue.fields.timeestimate}\n`;
		if (issue.fields.timespent) text += `Time Spent: ${issue.fields.timespent}\n`;
		if (issue.fields.resolutiondate) text += `Resolution Date: ${issue.fields.resolutiondate}\n`;
		if (issue.fields.description) text += `Description: ${issue.fields.description}\n`;
		if (issue.fields.progress?.percent) text += `Progress: ${issue.fields.progress.percent}%\n`;
		if (issue.fields.parent) text += `Parent Issue: ${this.formatMainIssueInfoText({
			issue: issue.fields.parent,
			host
		})}\n`;
		if (issue.fields.subtasks?.length > 0) {
			text += `Subtasks:\n`;
			issue.fields.subtasks.forEach((subtask) => {
				text += `  - ${this.formatMainIssueInfoText({
					issue: subtask,
					host
				})}\n`;
			});
		}
		if (issue.fields.issuelinks?.length > 0) {
			text += `Issue Links:\n`;
			issue.fields.issuelinks.forEach((link) => {
				text += `  - ${link.type.name}\n`;
				if (link.inwardIssue) text += `    - ${this.formatMainIssueInfoText({
					issue: link.inwardIssue,
					host
				})}\n`;
				if (link.outwardIssue) text += `    - ${this.formatMainIssueInfoText({
					issue: link.outwardIssue,
					host
				})}\n`;
			});
		}
		return text;
	}
	getLinkToIssue({ issueKey, host }) {
		return `${host}/browse/${issueKey}`;
	}
	formatMainIssueInfoText({ issue, host }) {
		const link = this.getLinkToIssue({
			issueKey: issue.key,
			host
		});
		const text = `${issue.key} (ID ${issue.id}) - ${issue.fields.summary} (${link})`;
		return text;
	}
};
const API_ENDPOINTS = { SEARCH: "/rest/api/2/search" };
/**
* Class representing a document loader for loading pages from Confluence.
*/
var JiraProjectLoader = class extends __langchain_core_document_loaders_base.BaseDocumentLoader {
	accessToken;
	host;
	projectKey;
	username;
	limitPerRequest;
	createdAfter;
	documentConverter;
	personalAccessToken;
	constructor({ host, projectKey, username, accessToken, limitPerRequest = 100, createdAfter, personalAccessToken }) {
		super();
		this.host = host;
		this.projectKey = projectKey;
		this.username = username;
		this.accessToken = accessToken;
		this.limitPerRequest = limitPerRequest;
		this.createdAfter = createdAfter;
		this.documentConverter = new JiraDocumentConverter({
			host,
			projectKey
		});
		this.personalAccessToken = personalAccessToken;
	}
	buildAuthorizationHeader() {
		if (this.personalAccessToken) return `Bearer ${this.personalAccessToken}`;
		return `Basic ${Buffer.from(`${this.username}:${this.accessToken}`).toString("base64")}`;
	}
	async load() {
		try {
			const allJiraIssues = await this.loadAsIssues();
			return this.documentConverter.convertToDocuments(allJiraIssues);
		} catch (error) {
			console.error("Error:", error);
			return [];
		}
	}
	async loadAsIssues() {
		const allIssues = [];
		for await (const issues of this.fetchIssues()) allIssues.push(...issues);
		return allIssues;
	}
	toJiraDateString(date) {
		if (!date) return void 0;
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const dayOfMonth = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${dayOfMonth}`;
	}
	async *fetchIssues() {
		const authorizationHeader = this.buildAuthorizationHeader();
		const url = `${this.host}${API_ENDPOINTS.SEARCH}`;
		const createdAfterAsString = this.toJiraDateString(this.createdAfter);
		let startAt = 0;
		while (true) try {
			const jqlProps = [`project=${this.projectKey}`, ...createdAfterAsString ? [`created>=${createdAfterAsString}`] : []];
			const params = new URLSearchParams({
				jql: jqlProps.join(" AND "),
				startAt: `${startAt}`,
				maxResults: `${this.limitPerRequest}`
			});
			const pageUrl = `${url}?${params}`;
			const options = {
				method: "GET",
				headers: {
					Authorization: authorizationHeader,
					Accept: "application/json"
				}
			};
			const response = await fetch(pageUrl, options);
			const data = await response.json();
			if (!data.issues || data.issues.length === 0) break;
			yield data.issues;
			startAt += this.limitPerRequest;
		} catch (error) {
			console.error(error);
			yield [];
		}
	}
};

//#endregion
exports.JiraDocumentConverter = JiraDocumentConverter;
exports.JiraProjectLoader = JiraProjectLoader;
Object.defineProperty(exports, 'jira_exports', {
  enumerable: true,
  get: function () {
    return jira_exports;
  }
});
//# sourceMappingURL=jira.cjs.map