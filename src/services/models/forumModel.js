export const DEFAULT_FORUM_TOPIC = "general";
export const DEFAULT_FORUM_SORT_BY = "recent";
export const DEFAULT_FORUM_FEED_LIMIT = 25;
export const DEFAULT_FORUM_COMMENT_LIMIT = 50;
export const MAX_FORUM_COMMENT_REPLY_DEPTH = 3;

const MAX_FORUM_TAGS = 5;
const MAX_SEARCH_TOKENS = 30;
const FORUM_COACH_RESPONSE_STATUSES = ["none", "requested", "responded"];

export const FORUM_TOPIC_SUGGESTIONS = Object.freeze([
  "general",
  "boxing",
  "mma",
  "muay thai",
  "bjj",
  "wrestling",
  "coach",
  "strength",
  "conditioning",
  "recovery",
]);

function normalizeString(value, maxLength = Number.POSITIVE_INFINITY) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue.slice(0, maxLength);
}

function normalizeNonNegativeInteger(value) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return 0;
  }

  return Math.floor(parsedValue);
}

function normalizeDateValue(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  return null;
}

function normalizeIdArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(values.map((value) => normalizeString(value)).filter(Boolean))
  );
}

function normalizeTags(tags) {
  const sourceValues =
    typeof tags === "string" ? tags.split(",") : Array.isArray(tags) ? tags : [];

  return Array.from(
    new Set(
      sourceValues
        .map((tag) => normalizeString(tag, 40).toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, MAX_FORUM_TAGS);
}

function normalizeCoachResponseStatus(value) {
  return FORUM_COACH_RESPONSE_STATUSES.includes(value) ? value : "none";
}

function normalizeSortBy(value) {
  return value === "popular" ? "popular" : DEFAULT_FORUM_SORT_BY;
}

function tokenizeLowercaseText(value) {
  return normalizeString(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

export function tokenizeForumSearchText(value) {
  return Array.from(new Set(tokenizeLowercaseText(value))).slice(
    0,
    MAX_SEARCH_TOKENS
  );
}

export function buildForumSearchIndex({
  title = "",
  body = "",
  topic = "",
  exerciseName = "",
  tags = [],
  authorDisplayName = "",
} = {}) {
  return tokenizeForumSearchText(
    [
      title,
      body,
      topic,
      exerciseName,
      authorDisplayName,
      ...(Array.isArray(tags) ? tags : []),
    ].join(" ")
  );
}

export function createDefaultForumProfile() {
  return {
    followedUserIds: [],
    likedPostIds: [],
    savedPostIds: [],
  };
}

export function normalizeForumProfile(profile = {}) {
  return {
    followedUserIds: normalizeIdArray(profile.followedUserIds),
    likedPostIds: normalizeIdArray(profile.likedPostIds),
    savedPostIds: normalizeIdArray(profile.savedPostIds),
  };
}

export function createDefaultForumFilters() {
  return {
    searchQuery: "",
    topic: "all",
    topics: [],
    exerciseId: "",
    tag: "",
    followedOnly: false,
    sortBy: DEFAULT_FORUM_SORT_BY,
    limit: DEFAULT_FORUM_FEED_LIMIT,
  };
}

export function createDefaultForumComposer() {
  return {
    title: "",
    body: "",
    topic: DEFAULT_FORUM_TOPIC,
    exerciseId: "",
    exerciseName: "",
    mediaUrl: "",
    mediaType: "image",
    tags: [],
    coachResponseRequested: false,
    featured: false,
    priorityScore: 0,
  };
}

export function createDefaultForumState() {
  return {
    forumProfile: createDefaultForumProfile(),
    forumFilters: createDefaultForumFilters(),
    forumComposer: createDefaultForumComposer(),
    forumFeed: [],
    forumComments: [],
    forumSelectedPost: null,
  };
}

export function normalizeForumPost(record = {}, viewerProfile = {}) {
  const normalizedProfile = normalizeForumProfile(viewerProfile);
  const id = normalizeString(record.id);
  const title = normalizeString(record.title, 140);
  const body = normalizeString(record.body, 5000);
  const mediaUrl = normalizeString(record.mediaUrl);
  const createdAt = normalizeDateValue(record.createdAt);
  const updatedAt = normalizeDateValue(record.updatedAt) || createdAt;

  return {
    id,
    authorId: normalizeString(record.authorId),
    authorDisplayName:
      normalizeString(record.authorDisplayName, 60) || "Anonymous",
    authorAvatarUrl: normalizeString(record.authorAvatarUrl),
    authorRole: normalizeString(record.authorRole) || "user",
    isCoachVerified: Boolean(record.isCoachVerified),
    title,
    body,
    excerpt:
      body.length > 180 ? `${body.slice(0, 177).trimEnd()}...` : body,
    topic: normalizeString(record.topic, 40) || DEFAULT_FORUM_TOPIC,
    exerciseId: normalizeString(record.exerciseId),
    exerciseName: normalizeString(record.exerciseName, 80),
    mediaUrl,
    mediaType: mediaUrl
      ? normalizeString(record.mediaType) || "image"
      : "none",
    tags: normalizeTags(record.tags),
    coachResponseRequested: Boolean(record.coachResponseRequested),
    coachResponseStatus: normalizeCoachResponseStatus(
      record.coachResponseStatus
    ),
    featured: Boolean(record.featured),
    priorityScore: normalizeNonNegativeInteger(record.priorityScore),
    likesCount: normalizeNonNegativeInteger(record.likesCount),
    savesCount: normalizeNonNegativeInteger(record.savesCount),
    commentsCount: normalizeNonNegativeInteger(record.commentsCount),
    contentType: mediaUrl ? "media" : "text",
    createdAt,
    updatedAt,
    searchIndex:
      Array.isArray(record.searchIndex) && record.searchIndex.length > 0
        ? tokenizeForumSearchText(record.searchIndex.join(" "))
        : buildForumSearchIndex({
            title,
            body,
            topic: record.topic,
            exerciseName: record.exerciseName,
            tags: record.tags,
            authorDisplayName: record.authorDisplayName,
          }),
    isLiked: normalizedProfile.likedPostIds.includes(id),
    isSaved: normalizedProfile.savedPostIds.includes(id),
    isFollowingAuthor: normalizedProfile.followedUserIds.includes(
      normalizeString(record.authorId)
    ),
  };
}

export function normalizeForumComment(record = {}, depth = 0) {
  const normalizedReplies =
    Array.isArray(record.replies) ?
      record.replies.map((reply) =>
        normalizeForumComment(
          {
            postId: record.postId,
            rootCommentId: record.rootCommentId || record.id,
            ...reply,
          },
          depth + 1
        )
      ) :
      [];

  return {
    id: normalizeString(record.id),
    postId: normalizeString(record.postId),
    parentCommentId: normalizeString(record.parentCommentId),
    rootCommentId:
      normalizeString(record.rootCommentId) || normalizeString(record.id),
    depth: normalizeNonNegativeInteger(record.depth ?? depth),
    authorId: normalizeString(record.authorId),
    authorDisplayName:
      normalizeString(record.authorDisplayName, 60) || "Anonymous",
    authorAvatarUrl: normalizeString(record.authorAvatarUrl),
    authorRole: normalizeString(record.authorRole) || "user",
    isCoachVerified: Boolean(record.isCoachVerified),
    body: normalizeString(record.body, 2000),
    createdAt: normalizeDateValue(record.createdAt),
    updatedAt: normalizeDateValue(record.updatedAt),
    replies: normalizedReplies,
    replyCount: normalizeNonNegativeInteger(
      record.replyCount ?? normalizedReplies.length
    ),
  };
}

export function flattenForumComments(comments = []) {
  return (Array.isArray(comments) ? comments : []).flatMap((comment) => [
    comment,
    ...flattenForumComments(comment?.replies),
  ]);
}

export function findForumCommentNode(comments = [], commentId, pathSegments = []) {
  for (const comment of Array.isArray(comments) ? comments : []) {
    const nextPathSegments = [...pathSegments, comment.id];

    if (comment?.id === commentId) {
      return {
        comment,
        pathSegments: nextPathSegments,
      };
    }

    const nestedMatch = findForumCommentNode(
      comment?.replies,
      commentId,
      [...nextPathSegments, "replies"]
    );

    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return null;
}

export function appendForumReply(comments = [], parentCommentId, reply) {
  return (Array.isArray(comments) ? comments : []).map((comment) => {
    if (comment?.id === parentCommentId) {
      const nextReplies = [...(Array.isArray(comment.replies) ? comment.replies : []), reply];

      return normalizeForumComment({
        ...comment,
        replies: nextReplies,
        replyCount: nextReplies.length,
      });
    }

    if (!Array.isArray(comment?.replies) || comment.replies.length === 0) {
      return comment;
    }

    return normalizeForumComment({
      ...comment,
      replies: appendForumReply(comment.replies, parentCommentId, reply),
    });
  });
}

export function applyForumFilters(
  posts = [],
  filters = {},
  viewerProfile = {}
) {
  const normalizedTopics = Array.isArray(filters?.topics)
    ? Array.from(
        new Set(
          filters.topics
            .map((topic) => normalizeString(topic).toLowerCase())
            .filter((topic) => topic && topic !== "all")
        )
      )
    : [];
  const legacyTopic = normalizeString(filters?.topic).toLowerCase();

  const normalizedFilters = {
    ...createDefaultForumFilters(),
    ...(filters || {}),
    searchQuery: normalizeString(filters?.searchQuery),
    topic: legacyTopic || "all",
    topics:
      normalizedTopics.length > 0
        ? normalizedTopics
        : legacyTopic && legacyTopic !== "all"
          ? [legacyTopic]
          : [],
    exerciseId: normalizeString(filters?.exerciseId),
    tag: normalizeString(filters?.tag).toLowerCase(),
    followedOnly: Boolean(filters?.followedOnly),
    sortBy: normalizeSortBy(filters?.sortBy),
    limit:
      Number(filters?.limit) > 0 ?
        Number(filters.limit) :
        DEFAULT_FORUM_FEED_LIMIT,
  };

  const normalizedProfile = normalizeForumProfile(viewerProfile);
  const searchTokens = tokenizeForumSearchText(normalizedFilters.searchQuery);

  return posts
    .map((post) => normalizeForumPost(post, normalizedProfile))
    .filter((post) => {
      if (
        normalizedFilters.followedOnly &&
        !normalizedProfile.followedUserIds.includes(post.authorId)
      ) {
        return false;
      }

      if (
        normalizedFilters.topics.length > 0 &&
        !normalizedFilters.topics.includes(post.topic.toLowerCase())
      ) {
        return false;
      }

      if (
        normalizedFilters.exerciseId &&
        post.exerciseId !== normalizedFilters.exerciseId
      ) {
        return false;
      }

      if (
        normalizedFilters.tag &&
        !post.tags.includes(normalizedFilters.tag)
      ) {
        return false;
      }

      if (searchTokens.length === 0) {
        return true;
      }

      const searchableText = [
        post.title,
        post.body,
        post.authorDisplayName,
        post.topic,
        post.exerciseName,
        post.tags.join(" "),
        post.searchIndex.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchTokens.every((token) => searchableText.includes(token));
    })
    .sort((left, right) => {
      if (left.featured !== right.featured) {
        return left.featured ? -1 : 1;
      }

      if (normalizedFilters.sortBy === "popular") {
        const rightScore =
          right.likesCount +
          right.savesCount +
          right.commentsCount +
          right.priorityScore;
        const leftScore =
          left.likesCount +
          left.savesCount +
          left.commentsCount +
          left.priorityScore;

        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }
      }

      const rightTime = Date.parse(right.updatedAt || right.createdAt || "") || 0;
      const leftTime = Date.parse(left.updatedAt || left.createdAt || "") || 0;

      if (rightTime !== leftTime) {
        return rightTime - leftTime;
      }

      return right.priorityScore - left.priorityScore;
    })
    .slice(0, normalizedFilters.limit);
}

export function buildForumPostPayload({
  draft = {},
  author,
  authorRole = "user",
  isCoachVerified = false,
} = {}) {
  if (!author?.uid) {
    throw new Error("A logged-in user is required to create a forum post.");
  }

  const title = normalizeString(draft.title, 140);
  const body = normalizeString(draft.body, 5000);
  const mediaUrl = normalizeString(draft.mediaUrl);

  if (!title) {
    throw new Error("Forum posts need a title.");
  }

  if (!body && !mediaUrl) {
    throw new Error("Forum posts need text or a media attachment.");
  }

  const topic = normalizeString(draft.topic, 40) || DEFAULT_FORUM_TOPIC;
  const tags = normalizeTags(draft.tags);
  const exerciseName = normalizeString(draft.exerciseName, 80);
  const authorDisplayName =
    normalizeString(author.displayName, 60) ||
    normalizeString(author.email?.split("@")[0], 60) ||
    "Anonymous";

  return {
    authorId: author.uid,
    authorDisplayName,
    authorAvatarUrl: normalizeString(author.photoURL),
    authorRole: normalizeString(authorRole) || "user",
    isCoachVerified: Boolean(isCoachVerified),
    title,
    body,
    topic,
    exerciseId: normalizeString(draft.exerciseId),
    exerciseName,
    mediaUrl,
    mediaType: mediaUrl
      ? normalizeString(draft.mediaType) || "image"
      : "none",
    tags,
    coachResponseRequested: Boolean(draft.coachResponseRequested),
    coachResponseStatus: draft.coachResponseRequested ? "requested" : "none",
    featured: Boolean(draft.featured),
    priorityScore: normalizeNonNegativeInteger(draft.priorityScore),
    likesCount: 0,
    savesCount: 0,
    commentsCount: 0,
    searchIndex: buildForumSearchIndex({
      title,
      body,
      topic,
      exerciseName,
      tags,
      authorDisplayName,
    }),
  };
}

export function buildForumCommentPayload({
  body,
  author,
  authorRole = "user",
  isCoachVerified = false,
} = {}) {
  if (!author?.uid) {
    throw new Error("A logged-in user is required to comment on a forum post.");
  }

  const normalizedBody = normalizeString(body, 2000);

  if (!normalizedBody) {
    throw new Error("Comments cannot be empty.");
  }

  return {
    authorId: author.uid,
    authorDisplayName:
      normalizeString(author.displayName, 60) ||
      normalizeString(author.email?.split("@")[0], 60) ||
      "Anonymous",
    authorAvatarUrl: normalizeString(author.photoURL),
    authorRole: normalizeString(authorRole) || "user",
    isCoachVerified: Boolean(isCoachVerified),
    body: normalizedBody,
  };
}
