import { useState } from "react";
import { View } from "react-native";
import CoachResponseView from "../../src/screens/screens/forum/coachResponseView.jsx";
import ForumView from "../../src/screens/screens/forum/ForumView.jsx";

function createPost(overrides) {
  return {
    authorId: "",
    authorDisplayName: "",
    authorAvatarUrl: "",
    authorRole: "user",
    isCoachVerified: false,
    title: "",
    body: "",
    excerpt: "",
    topic: "general",
    exerciseId: "",
    exerciseName: "",
    mediaUrl: "",
    mediaType: "none",
    tags: [],
    coachResponseRequested: false,
    coachResponseStatus: "none",
    featured: false,
    priorityScore: 0,
    likesCount: 0,
    savesCount: 0,
    commentsCount: 0,
    contentType: "text",
    createdAt: "",
    updatedAt: "",
    searchIndex: [],
    isLiked: false,
    isSaved: false,
    isFollowingAuthor: false,
    comments: [],
    ...overrides,
  };
}

function createComment(overrides) {
  return {
    id: "",
    postId: "",
    authorId: "",
    authorDisplayName: "",
    authorRole: "user",
    isCoachVerified: false,
    body: "",
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

const allPosts = [
  createPost({
    id: "post-1",
    authorId: "coach-daniel",
    authorDisplayName: "Coach Daniel",
    authorRole: "admin",
    isCoachVerified: true,
    title: "Best single gym session for stronger wrestling ties",
    body:
      "If you only have one lifting day, keep it heavy and short. A deadlift variation, weighted pull-ups, split squats, and loaded carries will cover most of what you need.",
    excerpt:
      "If you only have one lifting day, keep it heavy and short. A deadlift variation, weighted pull-ups, split squats, and loaded carries will cover most of what you need.",
    topic: "wrestling",
    exerciseName: "Trap Bar Deadlift",
    tags: ["wrestling", "strength", "grip"],
    coachResponseStatus: "responded",
    featured: true,
    priorityScore: 10,
    likesCount: 18,
    savesCount: 7,
    commentsCount: 2,
    comments: [
      createComment({
        id: "comment-1",
        postId: "post-1",
        authorId: "user-erik",
        authorDisplayName: "Erik",
        body: "Loaded carries have helped my tie-ups a lot. I recover from them much better than more pulling volume.",
        createdAt: "2026-04-01T10:10:00.000Z",
        updatedAt: "2026-04-01T10:10:00.000Z",
      }),
      createComment({
        id: "comment-2",
        postId: "post-1",
        authorId: "coach-daniel",
        authorDisplayName: "Coach Daniel",
        authorRole: "admin",
        isCoachVerified: true,
        body: "If time is limited, prioritize one heavy hinge, one single-leg pattern, and one grip-intensive carry.",
        createdAt: "2026-04-02T09:20:00.000Z",
        updatedAt: "2026-04-02T09:20:00.000Z",
      }),
    ],
    createdAt: "2026-04-01T08:00:00.000Z",
    updatedAt: "2026-04-02T09:30:00.000Z",
    searchIndex: ["wrestling", "strength", "grip", "trap", "bar", "deadlift"],
  }),
  createPost({
    id: "post-2",
    authorId: "user-mikael",
    authorDisplayName: "Mikael",
    title: "How are you adjusting recovery in hard sparring weeks?",
    body:
      "I usually cut accessory work by half, keep one main lift, and swap extra conditioning for easy bike work. Curious how other MMA athletes are handling it.",
    excerpt:
      "I usually cut accessory work by half, keep one main lift, and swap extra conditioning for easy bike work. Curious how other MMA athletes are handling it.",
    topic: "mma",
    tags: ["mma", "recovery", "conditioning"],
    coachResponseRequested: true,
    coachResponseStatus: "requested",
    priorityScore: 3,
    likesCount: 9,
    savesCount: 4,
    commentsCount: 1,
    comments: [
      createComment({
        id: "comment-3",
        postId: "post-2",
        authorId: "user-albin",
        authorDisplayName: "Albin",
        body: "I do something similar and also shorten technical drilling if the sparring volume is really high.",
        createdAt: "2026-04-01T18:10:00.000Z",
        updatedAt: "2026-04-01T18:10:00.000Z",
      }),
    ],
    createdAt: "2026-03-31T13:15:00.000Z",
    updatedAt: "2026-04-01T18:20:00.000Z",
    searchIndex: ["mma", "recovery", "conditioning", "sparring", "bike"],
  }),
  createPost({
    id: "post-3",
    authorId: "user-sara",
    authorDisplayName: "Sara",
    title: "Conditioning work that does not ruin boxing sessions",
    body:
      "The assault bike and short upper-body circuits have been much easier to recover from than extra roadwork for me.",
    excerpt:
      "The assault bike and short upper-body circuits have been much easier to recover from than extra roadwork for me.",
    topic: "boxing",
    exerciseName: "Assault Bike",
    tags: ["boxing", "conditioning"],
    likesCount: 6,
    savesCount: 2,
    commentsCount: 0,
    comments: [],
    createdAt: "2026-03-30T09:00:00.000Z",
    updatedAt: "2026-03-31T07:00:00.000Z",
    searchIndex: ["boxing", "conditioning", "assault", "bike"],
  }),
  createPost({
    id: "post-4",
    authorId: "user-lina",
    authorDisplayName: "Lina",
    title: "Best BJJ lift when your lower back is already fried",
    body:
      "Bulgarian split squats and chest-supported rows have let me keep training quality up without adding more low-back fatigue.",
    excerpt:
      "Bulgarian split squats and chest-supported rows have let me keep training quality up without adding more low-back fatigue.",
    topic: "bjj",
    tags: ["bjj", "strength", "recovery"],
    likesCount: 11,
    savesCount: 5,
    commentsCount: 3,
    comments: [
      createComment({
        id: "comment-4",
        postId: "post-4",
        authorId: "user-simon",
        authorDisplayName: "Simon",
        body: "Chest-supported rows have been one of my best swaps too.",
        createdAt: "2026-03-29T18:00:00.000Z",
        updatedAt: "2026-03-29T18:00:00.000Z",
      }),
      createComment({
        id: "comment-5",
        postId: "post-4",
        authorId: "user-maja",
        authorDisplayName: "Maja",
        body: "I also like reverse sled drags when my back is cooked.",
        createdAt: "2026-03-29T20:05:00.000Z",
        updatedAt: "2026-03-29T20:05:00.000Z",
      }),
      createComment({
        id: "comment-6",
        postId: "post-4",
        authorId: "coach-elias",
        authorDisplayName: "Coach Elias",
        authorRole: "admin",
        isCoachVerified: true,
        body: "That is a good trade. If the goal is preserving mat quality, reduce spinal loading first.",
        createdAt: "2026-03-30T08:40:00.000Z",
        updatedAt: "2026-03-30T08:40:00.000Z",
      }),
    ],
    createdAt: "2026-03-29T15:45:00.000Z",
    updatedAt: "2026-03-30T10:25:00.000Z",
    searchIndex: ["bjj", "strength", "recovery", "split", "squat", "rows"],
  }),
  createPost({
    id: "post-5",
    authorId: "coach-elias",
    authorDisplayName: "Coach Elias",
    authorRole: "admin",
    isCoachVerified: true,
    title: "Simple weekly setup for one lifting session and four practices",
    body:
      "Put the gym session after your easiest mat day, keep sprinting separate from hard sparring, and leave one day mostly for recovery.",
    excerpt:
      "Put the gym session after your easiest mat day, keep sprinting separate from hard sparring, and leave one day mostly for recovery.",
    topic: "general",
    tags: ["general", "recovery", "planning"],
    featured: true,
    priorityScore: 8,
    likesCount: 14,
    savesCount: 9,
    commentsCount: 4,
    comments: [
      createComment({
        id: "comment-7",
        postId: "post-5",
        authorId: "user-felix",
        authorDisplayName: "Felix",
        body: "Moving the gym day after the easiest mat session helped a lot for me too.",
        createdAt: "2026-03-28T14:00:00.000Z",
        updatedAt: "2026-03-28T14:00:00.000Z",
      }),
      createComment({
        id: "comment-8",
        postId: "post-5",
        authorId: "user-julia",
        authorDisplayName: "Julia",
        body: "Do you usually keep the sprint work year-round or only in certain blocks?",
        createdAt: "2026-03-28T15:45:00.000Z",
        updatedAt: "2026-03-28T15:45:00.000Z",
      }),
      createComment({
        id: "comment-9",
        postId: "post-5",
        authorId: "coach-elias",
        authorDisplayName: "Coach Elias",
        authorRole: "admin",
        isCoachVerified: true,
        body: "Mostly in blocks. Keep just enough sprint exposure to maintain quality, not enough to add fatigue.",
        createdAt: "2026-03-28T17:10:00.000Z",
        updatedAt: "2026-03-28T17:10:00.000Z",
      }),
      createComment({
        id: "comment-10",
        postId: "post-5",
        authorId: "user-hugo",
        authorDisplayName: "Hugo",
        body: "The recovery day point is easy to ignore until your week gets too dense.",
        createdAt: "2026-03-29T07:15:00.000Z",
        updatedAt: "2026-03-29T07:15:00.000Z",
      }),
    ],
    createdAt: "2026-03-28T11:30:00.000Z",
    updatedAt: "2026-03-29T08:10:00.000Z",
    searchIndex: ["general", "recovery", "planning", "weekly", "lifting"],
  }),
  createPost({
    id: "post-6",
    authorId: "user-noah",
    authorDisplayName: "Noah",
    title: "Upper-body focus session for shoulder-friendly striking strength",
    body:
      "Landmine press, neutral-grip pull-ups, and med-ball chest throws have worked better for me than barbell pressing.",
    excerpt:
      "Landmine press, neutral-grip pull-ups, and med-ball chest throws have worked better for me than barbell pressing.",
    topic: "muay thai",
    exerciseName: "Landmine Press",
    tags: ["muay thai", "strength", "shoulders"],
    likesCount: 5,
    savesCount: 1,
    commentsCount: 1,
    comments: [
      createComment({
        id: "comment-11",
        postId: "post-6",
        authorId: "user-tim",
        authorDisplayName: "Tim",
        body: "Landmine press has been the same for me. Much easier on the shoulder than straight bar pressing.",
        createdAt: "2026-03-28T08:20:00.000Z",
        updatedAt: "2026-03-28T08:20:00.000Z",
      }),
    ],
    createdAt: "2026-03-27T18:00:00.000Z",
    updatedAt: "2026-03-28T09:15:00.000Z",
    searchIndex: ["muay", "thai", "strength", "shoulders", "landmine", "press"],
  }),
  createPost({
    id: "post-7",
    authorId: "user-ida",
    authorDisplayName: "Ida",
    title: "Anyone pairing hill sprints with wrestling this season?",
    body:
      "I am trying short hill sprints once per week and keeping the total number of efforts low. Interested in how others are progressing them.",
    excerpt:
      "I am trying short hill sprints once per week and keeping the total number of efforts low. Interested in how others are progressing them.",
    topic: "wrestling",
    tags: ["wrestling", "conditioning", "speed"],
    likesCount: 8,
    savesCount: 3,
    commentsCount: 2,
    comments: [
      createComment({
        id: "comment-12",
        postId: "post-7",
        authorId: "user-nils",
        authorDisplayName: "Nils",
        body: "I keep it at six to eight total efforts and stop if the quality drops.",
        createdAt: "2026-03-26T08:00:00.000Z",
        updatedAt: "2026-03-26T08:00:00.000Z",
      }),
      createComment({
        id: "comment-13",
        postId: "post-7",
        authorId: "coach-daniel",
        authorDisplayName: "Coach Daniel",
        authorRole: "admin",
        isCoachVerified: true,
        body: "That is the right direction. Progress the quality of each sprint before adding more volume.",
        createdAt: "2026-03-27T06:55:00.000Z",
        updatedAt: "2026-03-27T06:55:00.000Z",
      }),
    ],
    createdAt: "2026-03-26T06:50:00.000Z",
    updatedAt: "2026-03-27T07:20:00.000Z",
    searchIndex: ["wrestling", "conditioning", "speed", "hill", "sprints"],
  }),
  createPost({
    id: "post-8",
    authorId: "user-omar",
    authorDisplayName: "Omar",
    title: "Favorite recovery habits between back-to-back sessions?",
    body:
      "A bigger cooldown, more carbs right after training, and walking later in the evening have probably helped more than any supplement.",
    excerpt:
      "A bigger cooldown, more carbs right after training, and walking later in the evening have probably helped more than any supplement.",
    topic: "recovery",
    tags: ["recovery", "nutrition"],
    likesCount: 7,
    savesCount: 6,
    commentsCount: 1,
    comments: [
      createComment({
        id: "comment-14",
        postId: "post-8",
        authorId: "user-elin",
        authorDisplayName: "Elin",
        body: "Walking after evening practice has been underrated for me too.",
        createdAt: "2026-03-25T16:10:00.000Z",
        updatedAt: "2026-03-25T16:10:00.000Z",
      }),
    ],
    createdAt: "2026-03-25T12:40:00.000Z",
    updatedAt: "2026-03-26T08:00:00.000Z",
    searchIndex: ["recovery", "nutrition", "cooldown", "carbs", "walking"],
  }),
  createPost({
    id: "post-9",
    authorId: "user-emma",
    authorDisplayName: "Emma",
    title: "Best strength accessories for stronger clinch posture",
    body:
      "I keep coming back to chest-supported rows, rear-delt work, and heavy carries. They seem to transfer well without beating me up.",
    excerpt:
      "I keep coming back to chest-supported rows, rear-delt work, and heavy carries. They seem to transfer well without beating me up.",
    topic: "strength",
    tags: ["strength", "clinch", "posture"],
    likesCount: 10,
    savesCount: 4,
    commentsCount: 2,
    comments: [
      createComment({
        id: "comment-15",
        postId: "post-9",
        authorId: "user-anton",
        authorDisplayName: "Anton",
        body: "Rear-delt work has been huge for my clinch posture as well.",
        createdAt: "2026-03-24T13:00:00.000Z",
        updatedAt: "2026-03-24T13:00:00.000Z",
      }),
      createComment({
        id: "comment-16",
        postId: "post-9",
        authorId: "user-klara",
        authorDisplayName: "Klara",
        body: "Heavy suitcase carries seem to transfer especially well for me.",
        createdAt: "2026-03-25T08:35:00.000Z",
        updatedAt: "2026-03-25T08:35:00.000Z",
      }),
    ],
    createdAt: "2026-03-24T10:10:00.000Z",
    updatedAt: "2026-03-25T09:10:00.000Z",
    searchIndex: ["strength", "clinch", "posture", "rows", "carries"],
  }),
  createPost({
    id: "post-10",
    authorId: "user-viktor",
    authorDisplayName: "Viktor",
    title: "Keeping power work in while cutting volume",
    body:
      "When I feel run down, I keep jumps and throws but reduce the total contacts. That has preserved sharpness better than removing them completely.",
    excerpt:
      "When I feel run down, I keep jumps and throws but reduce the total contacts. That has preserved sharpness better than removing them completely.",
    topic: "conditioning",
    tags: ["conditioning", "power", "fatigue"],
    likesCount: 4,
    savesCount: 2,
    commentsCount: 0,
    comments: [],
    createdAt: "2026-03-23T16:35:00.000Z",
    updatedAt: "2026-03-24T08:45:00.000Z",
    searchIndex: ["conditioning", "power", "fatigue", "jumps", "throws"],
  }),
  createPost({
    id: "post-11",
    authorId: "user-leo",
    authorDisplayName: "Leo",
    title: "Do you prefer front squats or split squats for MMA?",
    body:
      "Front squats feel great when I am fresh, but split squats are easier to recover from when the week is already packed with hard practices.",
    excerpt:
      "Front squats feel great when I am fresh, but split squats are easier to recover from when the week is already packed with hard practices.",
    topic: "mma",
    tags: ["mma", "strength", "legs"],
    likesCount: 12,
    savesCount: 5,
    commentsCount: 3,
    comments: [
      createComment({
        id: "comment-17",
        postId: "post-11",
        authorId: "user-max",
        authorDisplayName: "Max",
        body: "Split squats win for me once sparring volume climbs.",
        createdAt: "2026-03-22T17:20:00.000Z",
        updatedAt: "2026-03-22T17:20:00.000Z",
      }),
      createComment({
        id: "comment-18",
        postId: "post-11",
        authorId: "user-nora",
        authorDisplayName: "Nora",
        body: "Front squats are great early in the week, split squats later.",
        createdAt: "2026-03-22T19:10:00.000Z",
        updatedAt: "2026-03-22T19:10:00.000Z",
      }),
      createComment({
        id: "comment-19",
        postId: "post-11",
        authorId: "coach-elias",
        authorDisplayName: "Coach Elias",
        authorRole: "admin",
        isCoachVerified: true,
        body: "Good rule of thumb: choose the option you can recover from while keeping skill work sharp.",
        createdAt: "2026-03-23T07:00:00.000Z",
        updatedAt: "2026-03-23T07:00:00.000Z",
      }),
    ],
    createdAt: "2026-03-22T14:00:00.000Z",
    updatedAt: "2026-03-23T07:55:00.000Z",
    searchIndex: ["mma", "strength", "legs", "front", "squat", "split"],
  }),
  createPost({
    id: "post-12",
    authorId: "user-hanna",
    authorDisplayName: "Hanna",
    title: "Anyone using neck work year-round for grappling?",
    body:
      "I have kept it in twice per week with low volume and it seems to be sustainable. I am mostly using isometrics and very controlled reps.",
    excerpt:
      "I have kept it in twice per week with low volume and it seems to be sustainable. I am mostly using isometrics and very controlled reps.",
    topic: "bjj",
    tags: ["bjj", "grappling", "neck"],
    likesCount: 9,
    savesCount: 3,
    commentsCount: 1,
    comments: [
      createComment({
        id: "comment-20",
        postId: "post-12",
        authorId: "user-olivia",
        authorDisplayName: "Olivia",
        body: "Low-volume isometrics have been the only neck work I can sustain year-round too.",
        createdAt: "2026-03-21T12:00:00.000Z",
        updatedAt: "2026-03-21T12:00:00.000Z",
      }),
    ],
    createdAt: "2026-03-21T09:20:00.000Z",
    updatedAt: "2026-03-22T06:40:00.000Z",
    searchIndex: ["bjj", "grappling", "neck", "isometrics"],
  }),
];

function getPosts(startIndex = 0) {
  return allPosts.slice(startIndex, startIndex + 10);
}

export default function ForumScreen() {
  const [posts, setPosts] = useState(() => getPosts());
  const [isCoachResponseVisible, setIsCoachResponseVisible] = useState(false);

  function togglePostLike(postId) {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id !== postId ?
          post :
          {
            ...post,
            isLiked: !post.isLiked,
            likesCount: Math.max(0, (post.likesCount || 0) + (post.isLiked ? -1 : 1)),
          }
      )
    );
  }

  function togglePostSave(postId) {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id !== postId ?
          post :
          {
            ...post,
            isSaved: !post.isSaved,
            savesCount: Math.max(0, (post.savesCount || 0) + (post.isSaved ? -1 : 1)),
          }
      )
    );
  }

  function showCoachResponseView() {
    setIsCoachResponseVisible(true);
  }

  function hideCoachResponseView() {
    setIsCoachResponseVisible(false);
  }

  return (
    <View style={{ flex: 1 }}>
      <ForumView
        posts={posts}
        onTogglePostLike={togglePostLike}
        onTogglePostSave={togglePostSave}
        onToggleCoachResponse={showCoachResponseView}
      />
      {isCoachResponseVisible ? (
        <CoachResponseView onClose={hideCoachResponseView} />
      ) : null}
    </View>
  );
}
