import * as core from '@actions/core';
import * as github from '@actions/github';
import axios from 'axios';

export async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('GITHUB_TOKEN');

    const context = github.context;
    if (context.payload.pull_request == null) {
      core.setFailed('No pull request found.');
      return;
    }

    const chuckResponse = await axios.get(
      'https://api.chucknorris.io/jokes/random?category=dev'
    );

    const pullRequestNumber = context.payload.pull_request.number;
    const octokit = github.getOctokit(githubToken);
    const response = await octokit.issues.createComment({
      ...context.repo,
      // eslint-disable-next-line @typescript-eslint/camelcase
      issue_number: pullRequestNumber,
      body: chuckResponse.data.value
    });

    core.setOutput('comment-url', response.data.html_url);
  } catch (error) {
    core.setFailed(error.message);
  }
}
