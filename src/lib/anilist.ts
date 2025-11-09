export type AniListTitle = {
    romaji?: string;
    english?: string;
};

export type AniListMedia = {
    id: number;
    title: AniListTitle;
    siteUrl: string;
};

export type AniListEntry = {
    id: number;
    status: string;
    score: number;
    progress: number;
    media: AniListMedia;
};

export type AniListList = {
    name: string;
    status?: string;
    entries: AniListEntry[];
};

export type AniListUser = {
    id: number;
    name: string;
    siteUrl: string;
    avatar: { medium: string };
};

export type AniListCollection = {
    user: AniListUser;
    lists: AniListList[];
};

type AniListGraphQLResponse = {
    data?: { MediaListCollection: AniListCollection };
    errors?: Array<{ message: string }>;
};

const QUERY = `
  query ($userName: String!) {
    MediaListCollection(userName: $userName, type: ANIME) {
      user { id name siteUrl avatar { medium } }
      lists {
        name
        status
        entries {
          id status score progress
          media { id title { romaji english } siteUrl }
        }
      }
    }
  }`;

export async function fetchAniListCollection(userName: string): Promise<AniListCollection> {
    const variables = { userName };

    const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // Provide a UA to avoid some providers blocking generic fetch clients
            'User-Agent': 'jamescrovo/1.0 (+https://jamescrovo.com)'
        },
        body: JSON.stringify({ query: QUERY, variables }),
        // Ensure fresh data on the server when desired; callers can override via fetch cache options
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`AniList request failed: ${res.status} ${res.statusText}`);
    }

    const json: AniListGraphQLResponse = await res.json();
    if (json.errors?.length) {
        const message = json.errors.map(e => e.message).join('; ');
        throw new Error(`AniList GraphQL error: ${message}`);
    }

    if (!json.data?.MediaListCollection) {
        throw new Error('AniList response missing MediaListCollection');
    }

    return json.data.MediaListCollection;
}


