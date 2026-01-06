import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { MyProfileView } from "/src/views/MyProfileView.jsx";

const MyProfile = observer(function MyProfile(props) {
  const navigate = useNavigate();
  function isGoogleUserACB() {
    const providers = user?.providerData || [];
    return providers.some((p) => p?.providerId === "google.com");
  }
  const model = props.model;
  const user = model?.user || {};
  const isGoogleUser = useMemo(isGoogleUserACB, [user?.providerData]);
  // Local form state (allowed by your instructor)
  const [username, setUsername] = useState(user.displayName || "");
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep form in sync if currentUser changes (e.g., after login)
  useEffect(function syncFormWithModelACB() {
    setUsername(user.displayName || "");
    setEmail(user.email || "");
    setPassword("");
  }, [user.displayName, user.email]);

  const subscriptionText = useMemo(function subscriptionTextACB() {
    // Check if user has active subscription
    const daysRemaining = model.getDaysRemainingInSubscription();
    
    if (daysRemaining <= 0) {
      return "No active subscription";
    }

    const endDate = model.getSubscriptionEndDate();
    if (daysRemaining === 1) {
      return `Active - expires ${endDate} (1 day remaining)`;
    } else {
      return `Active - expires ${endDate} (${daysRemaining} days remaining)`;
    }
  }, [model.subscription, model.subscriptionEndDate]);

  const canSave = useMemo(
    function canSaveACB() {
      const changed =
        username !== (user.displayName || "") ||
        (!isGoogleUser && password.length > 0);

      const valid = username.trim().length > 0;
      return changed && valid;
    },
    [
      username,
      password,
      isGoogleUser,
      user.displayName,
    ]
  );

  async function saveACB(evt) {
    evt.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      await model.updateProfile({
        displayName: username,
        password: password,
        isGoogleUser: isGoogleUser
      });
    } catch (e) {
      setError(e.message || "Update failed.");
    } finally {
      setIsSubmitting(false);
      setPassword("");
    }
  }
  function cancelACB() {
    setError(null);
    setUsername(user.displayName || "");
    setPassword("");
  }

  function changeSubscriptionACB() {
    // Navigate to your subscription page (adjust the route if needed)
    navigate("/subscription");
  }

  async function logoutACB() {
    setError(null);
    setIsSubmitting(true);

    try {
      await model.submitLogout();
      navigate("/login");
    } catch (e) {
      console.error(e);
      setError(e.message || "Logout failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MyProfileView
      username={username}
      email={email}
      password={password}
      subscriptionText={subscriptionText}
      isSubmitting={isSubmitting}
      error={error}
      canSave={canSave}
      onUsernameChange={setUsername}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSave={saveACB}
      onCancel={cancelACB}
      onChangeSubscription={changeSubscriptionACB}
      onLogout={logoutACB}
      hidePassword={isGoogleUser}
    />
  );
});

export { MyProfile };
