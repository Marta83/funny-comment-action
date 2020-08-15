import * as core from '@actions/core';
import * as github from '@actions/github';
import axios from 'axios';

async function getChuckText(): Promise<string> {
  try {
    const chuckResponse = await axios.get(
      'https://api.chucknorris.io/jokes/random?category=dev'
    );
    const image = `![icon_url](${chuckResponse.data.icon_url})`;

    return `${image} ${chuckResponse.data.value}`;
  } catch (error) {
    core.setFailed(`GetChuckText:${error.message}`);
    return '';
  }
}

async function getGif(tag: string): Promise<string> {
  try {
    const giphyToken = core.getInput('GIPHY_TOKEN');
    let gif = '';

    if (giphyToken) {
      const giphyResponse = await axios.get(
        `https://api.giphy.com/v1/gifs/random?api_key=${giphyToken}&tag=${tag}`
      );

      gif = `![gif_url](${giphyResponse.data.data.image_url})`;
    }

    return gif;
  } catch (error) {
    core.setFailed(`GetGif:${error.message}`);
    return '';
  }
}

async function getChuckComment(): Promise<string> {
  try {
    const message =
      "Thanks for contributing, meanwhile you wait, hope you have fun with this **Chuck Norris' fun fact.**";
    const chuck = await getChuckText();
    const gif = await getGif('laughing');

    return `${message} \n\n${chuck} \n\n${gif}`;
  } catch (error) {
    core.setFailed(`GetComment:${error.message}`);
    return '';
  }
}

async function getGiphyComment(): Promise<string> {
  try {
    const message =
      'Thanks for contributing, meanwhile you wait, **hope you have fun with this gif.**';
    const tags = ['funny', 'good luck', 'thank you', 'thumbs up', 'slipping'];
    const random = Math.floor(Math.random() * tags.length);

    const gif = await getGif(tags[random]);

    return `${message} \n\n${gif}`;
  } catch (error) {
    core.setFailed(`GetComment:${error.message}`);
    return '';
  }
}

function getCommentFunction(): Function {
  const commentType = core.getInput('comment_type');

  const commentFunctions = [getChuckComment, getGiphyComment];
  const random = Math.floor(Math.random() * commentFunctions.length);

  return commentType === 'chuck'
    ? getChuckComment
    : commentType === 'gif'
    ? getGiphyComment
    : commentFunctions[random];
}

export async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('GITHUB_TOKEN');

    const context = github.context;

    if (context.payload.pull_request == null && context.payload.issue == null) {
      core.setFailed('No pull request found.');
      return;
    }

    const comment = await getCommentFunction()();

    const requestNumber =
      context.payload.pull_request?.number || context.payload.issue?.number;
    const octokit = github.getOctokit(githubToken);

    const response = await octokit.issues.createComment({
      ...context.repo,
      // eslint-disable-next-line @typescript-eslint/camelcase, @typescript-eslint/no-non-null-assertion
      issue_number: requestNumber!,
      body: comment
    });

    core.setOutput('comment-url', response.data.html_url);
  } catch (error) {
    core.setFailed(error.message);
  }
}
