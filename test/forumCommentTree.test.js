import test from "node:test";
import assert from "node:assert/strict";

import {
  ANALYSIS_FORUM_TAG,
  appendForumReply,
  applyForumFilters,
  buildForumPostPayload,
  findForumCommentNode,
  flattenForumComments,
  normalizeForumComment,
  normalizeForumPost,
} from "../src/services/models/forumModel.js";

const thread = [
  normalizeForumComment({
    id: "root",
    postId: "post-1",
    body: "Root comment",
    depth: 0,
    replies: [
      {
        id: "reply-1",
        postId: "post-1",
        parentCommentId: "root",
        rootCommentId: "root",
        body: "First reply",
        depth: 1,
        replies: [
          {
            id: "reply-2",
            postId: "post-1",
            parentCommentId: "reply-1",
            rootCommentId: "root",
            body: "Second reply",
            depth: 2,
          },
        ],
      },
    ],
  }),
];

test("findForumCommentNode returns nested comment path segments", () => {
  const match = findForumCommentNode(thread, "reply-2");

  assert.ok(match);
  assert.equal(match.comment.id, "reply-2");
  assert.deepEqual(match.pathSegments, [
    "root",
    "replies",
    "reply-1",
    "replies",
    "reply-2",
  ]);
});

test("appendForumReply appends a reply to the right branch", () => {
  const nextThread = appendForumReply(
    thread,
    "reply-1",
    normalizeForumComment({
      id: "reply-3",
      postId: "post-1",
      parentCommentId: "reply-1",
      rootCommentId: "root",
      body: "Inserted reply",
      depth: 2,
    })
  );

  const updatedParent = findForumCommentNode(nextThread, "reply-1");
  const insertedReply = findForumCommentNode(nextThread, "reply-3");

  assert.ok(updatedParent);
  assert.ok(insertedReply);
  assert.equal(updatedParent.comment.replyCount, 2);
  assert.equal(insertedReply.comment.parentCommentId, "reply-1");
});

test("flattenForumComments returns every comment in the thread", () => {
  const flattenedComments = flattenForumComments(thread);

  assert.deepEqual(
    flattenedComments.map((comment) => comment.id),
    ["root", "reply-1", "reply-2"]
  );
});

test("forum posts preserve uploaded video media type", () => {
  const payload = buildForumPostPayload({
    draft: {
      title: "Bag work form check",
      body: "",
      mediaUrl: "https://example.com/forum/video.mp4",
      mediaType: "video",
    },
    author: {
      uid: "user-1",
      displayName: "Athlete",
    },
  });
  const normalizedPost = normalizeForumPost({
    id: "post-1",
    ...payload,
  });

  assert.equal(payload.mediaType, "video");
  assert.equal(normalizedPost.mediaType, "video");
  assert.equal(normalizedPost.contentType, "media");
});

test("forum feed excludes analysis posts unless the analysis tag is selected", () => {
  const posts = [
    {
      id: "regular-post",
      title: "Regular forum post",
      body: "Open discussion",
      tags: ["training"],
      updatedAt: "2026-01-02T00:00:00.000Z",
    },
    {
      id: "analysis-post",
      title: "Analysis video",
      body: "Form review",
      tags: [ANALYSIS_FORUM_TAG],
      mediaUrl: "https://example.com/analysis.mp4",
      mediaType: "video",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const regularFeed = applyForumFilters(posts);
  const analysisFeed = applyForumFilters(posts, {
    topics: [ANALYSIS_FORUM_TAG],
  });

  assert.deepEqual(
    regularFeed.map((post) => post.id),
    ["regular-post"]
  );
  assert.deepEqual(
    analysisFeed.map((post) => post.id),
    ["analysis-post"]
  );
});

test("forum feed keeps analysis posts hidden for non-analysis tag filters", () => {
  const posts = [
    {
      id: "regular-training-post",
      title: "Training post",
      body: "General training",
      tags: ["training"],
    },
    {
      id: "analysis-training-post",
      title: "Analysis training video",
      body: "Form review",
      tags: [ANALYSIS_FORUM_TAG, "training"],
    },
  ];

  const filteredFeed = applyForumFilters(posts, { tag: "training" });

  assert.deepEqual(
    filteredFeed.map((post) => post.id),
    ["regular-training-post"]
  );
});
