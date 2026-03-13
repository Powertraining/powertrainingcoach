/**
 * Service to fetch and filter base training plans from Firebase Storage
 */
import { storage } from "../config/firebase.js";
import { getDownloadURL, listAll, ref } from "../config/firebaseSdk.js";

/**
 * Fetches all base training plans from Firebase Storage
 * @returns {Promise<Array>} Array of training plan objects
 */
export async function fetchBaseTrainingPlans() {
  try {
    const plansRef = ref(storage, "baseTrainingPlans");
    const result = await listAll(plansRef);
    
    const plans = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const response = await fetch(url);
        const plan = await response.json();
        return {
          ...plan,
          id: itemRef.name.replace(".json", ""),
          fileName: itemRef.name,
        };
      })
    );
    
    return plans;
  } catch (error) {
    console.error("Error fetching base training plans:", error);
    throw error;
  }
}

/**
 * Filters training plans based on user's questionnaire inputs
 * @param {Array} plans - Array of training plan objects
 * @param {Object} filters - Filter criteria from questionnaire
 * @param {string} filters.primaryCombatSport - User's selected combat sport
 * @param {number} filters.sessionsPerWeek - Number of sessions per week
 * @param {string} filters.goal - Training goal (hypertrophy, strength, power)
 * @param {string} filters.experience - Experience level
 * @returns {Array} Filtered array of training plans
 */
export function filterTrainingPlans(plans, filters) {
  const { primaryCombatSport, sessionsPerWeek, goal, experience } = filters;
  
  return plans.filter((plan) => {
    // Filter by combat sport if specified in plan metadata
    if (plan.sport && primaryCombatSport) {
      const planSports = Array.isArray(plan.sport) ? plan.sport : [plan.sport];
      const sportMatch = planSports.some(
        (sport) => 
          sport.toLowerCase() === primaryCombatSport.toLowerCase() ||
          sport.toLowerCase() === "all" ||
          sport.toLowerCase() === "general"
      );
      if (!sportMatch) return false;
    }
    
    // Filter by sessions per week if specified in plan metadata
    if (plan.sessionsPerWeek && sessionsPerWeek) {
      // Allow plans within ±1 session of user's preference
      const planSessions = parseInt(plan.sessionsPerWeek, 10);
      if (Math.abs(planSessions - sessionsPerWeek) > 1) return false;
    }
    
    // Filter by goal if specified
    if (plan.goal && goal) {
      const planGoals = Array.isArray(plan.goal) ? plan.goal : [plan.goal];
      const goalMatch = planGoals.some(
        (g) => g.toLowerCase() === goal.toLowerCase() || g.toLowerCase() === "general"
      );
      if (!goalMatch) return false;
    }
    
    // Filter by experience level if specified
    if (plan.experience && experience) {
      const planExperience = Array.isArray(plan.experience) 
        ? plan.experience 
        : [plan.experience];
      const experienceMatch = planExperience.some(
        (e) => 
          e.toLowerCase() === experience.toLowerCase() || 
          e.toLowerCase() === "all"
      );
      if (!experienceMatch) return false;
    }
    
    return true;
  });
}

/**
 * Extracts the first week from a training plan for preview
 * @param {Object} plan - Training plan object
 * @returns {Object} First week data with plan metadata
 */
export function extractFirstWeekPreview(plan) {
  const firstWeek = plan.weeks?.[0] || null;
  
  return {
    id: plan.id,
    name: plan.name || `Plan ${plan.id}`,
    description: plan.description || plan.summary || "",
    sport: plan.sport,
    sessionsPerWeek: plan.sessionsPerWeek,
    goal: plan.goal,
    experience: plan.experience,
    totalWeeks: plan.weeks?.length || 0,
    firstWeek: firstWeek,
  };
}

/**
 * Fetches and filters training plans, returning previews
 * @param {Object} filters - Filter criteria from questionnaire
 * @returns {Promise<Array>} Array of plan previews with first week data
 */
export async function getFilteredPlanPreviews(filters) {
  const allPlans = await fetchBaseTrainingPlans();
  const filteredPlans = filterTrainingPlans(allPlans, filters);
  return filteredPlans.map(extractFirstWeekPreview);
}
