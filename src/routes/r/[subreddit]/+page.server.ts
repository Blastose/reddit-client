import type { PageServerLoad } from './$types';
import { jsrwrap } from '$lib/server/reddit';
import type { SubmissionData, SubredditData } from 'jsrwrap/types';

export const load = (async ({ cookies, params, setHeaders, isDataRequest }) => {
	// TODO move this into its own function since the logic is shared
	// by /r/[subredit]/[sort] routes
	// or maybe move it this and the [sort] routes into a layout group

	const subreddit = params.subreddit;

	const jsrWrapsubreddit = jsrwrap.getSubreddit(subreddit);

	setHeaders({ 'cache-control': 'public, max-age=60' });

	if (cookies.get('name') === 'skip') {
		cookies.set('name', '', {
			path: '/',
			expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT;'),
			httpOnly: false,
			sameSite: 'none'
		});
		return { streamed: { posts: [] } } as unknown as {
			streamed: { posts: SubmissionData[] };
			about: SubredditData;
		};
	}

	const posts = jsrWrapsubreddit.getSubmissions({ sort: 'hot', params: {} });
	return { streamed: { posts: isDataRequest ? posts : await posts } };
}) satisfies PageServerLoad;
