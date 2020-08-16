import {run} from '../run';
import * as core from '@actions/core';
import * as github from '@actions/github';
import nock from 'nock';
import * as process from 'process';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => {
  jest.resetModules();

  github.context.payload = {
    action: 'opened',
    // eslint-disable-next-line @typescript-eslint/camelcase
    pull_request: {
      number: 1
    }
  };

  mockedAxios.get.mockResolvedValue({data: {value: 'Test Comment'}});
});

test('comments on PR', async () => {
  process.env['INPUT_GITHUB_TOKEN'] = 'test-github-token';
  process.env['GITHUB_REPOSITORY'] = 'testowner/testrepo';

  nock('https://api.github.com')
    .post(
      '/repos/testowner/testrepo/issues/1/comments',
      body => body.body === 'Test Comment'
    )
    .reply(200, {
      // eslint-disable-next-line @typescript-eslint/camelcase
      html_url: 'https://github.com/testowner/testrepo/issues/1#issuecomment-1'
    });
  const setOutputMock = jest.spyOn(core, 'setOutput');

  await run();

  expect(setOutputMock).toHaveBeenCalledWith(
    'comment-url',
    'https://github.com/testowner/testrepo/issues/1#issuecomment-1'
  );
});
