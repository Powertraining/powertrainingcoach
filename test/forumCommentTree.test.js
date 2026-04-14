import test from "node:test";
import assert from "node:assert/strict";

import {
  appendForumReply,
  findForumCommentNode,
  flattenForumComments,
  normalizeForumComment,
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
