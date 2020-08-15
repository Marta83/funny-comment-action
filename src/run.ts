import * as core from '@actions/core';
import * as github from '@actions/github';

export async function run(): Promise<void> {
  try {
    const comment = core.getInput('comment');
    const github_token = core.getInput('GITHUB_TOKEN');

    const context = github.context;
    if (context.payload.pull_request == null) {
      core.setFailed('No pull request found.');
      return;
    }

    const pull_request_number = context.payload.pull_request.number;

    const octokit = github.getOctokit(github_token);
    const response = await octokit.issues.createComment({
      ...context.repo,
      issue_number: pull_request_number,
      body: comment
    });

    core.setOutput('comment-url', response.data.html_url);
  } catch (error) {
    core.setFailed(error.message);
  }
}
