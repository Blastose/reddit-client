import { jsrwrap } from '$lib/server/reddit';
import type { SubmissionData, SubredditData } from 'jsrwrap/types';
import { error } from '@sveltejs/kit';

type Time = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

export const load = async ({ cookies, params, setHeaders, url, isDataRequest }) => {
	const subreddit = params.subreddit;
	const sort = params.sort as 'top' | 'new' | 'controversial' | 'rising';

	let t = url.searchParams.get('t') as Time | null;
	t = t ?? 'day';

	const jsrWrapsubreddit = jsrwrap.getSubreddit(subreddit);

	const about = await jsrWrapsubreddit.getAbout();

	if (cookies.get('name') === 'skip') {
		cookies.set('name', '', {
			path: '/',
			expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT;'),
			httpOnly: false,
			sameSite: 'none'
		});
		return { streamed: { posts: [] }, about } as unknown as {
			streamed: { posts: SubmissionData[] };
			about: SubredditData;
		};
	}

	const posts = jsrWrapsubreddit.getSubmissions({ sort, params: { t } });

	if (!posts) throw error(500);

	setHeaders({ 'cache-control': 'public, max-age=60' });

	return { streamed: { posts: isDataRequest ? posts : await posts }, about };
};
