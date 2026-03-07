import "/src/style.css";

export function MyProfileView(props) {
  function usernameChangedACB(evt) {
    props.onUsernameChange(evt.target.value);
  }
  function passwordChangedACB(evt) {
    props.onPasswordChange(evt.target.value);
  }

  return (
    <div className="profile-page">
      <h2 className="profile-title">My Profile</h2>

      <form className="profile-form" onSubmit={props.onSave}>
        <div className="profile-row">
          <label htmlFor="profile-username" className="profile-label">Username:</label>
          <input
            id="profile-username"
            className="profile-input"
            type="text"
            value={props.username}
            placeholder={props.usernamePlaceholder}
            onChange={usernameChangedACB}
            disabled={props.isSubmitting}
          />
        </div>

        <div className="profile-row">
          <label htmlFor="profile-email" className="profile-label">E-mail:</label>
          <input
            id="profile-email"
            className="profile-input profile-input--readonly"
            type="email"
            value={props.email}
            placeholder={props.emailPlaceholder}
            disabled
            readOnly
          />
        </div>

        {!props.hidePassword && (
          <div className="profile-row">
            <label htmlFor="profile-password" className="profile-label">Password:</label>
            <input
              id="profile-password"
              className="profile-input"
              type="password"
              value={props.password}
              onChange={passwordChangedACB}
              disabled={props.isSubmitting}
              placeholder="••••••••"
            />
          </div>
        )}


        {props.error && <p className="profile-error">{props.error}</p>}

        <div className="profile-actions">
          <button
            className="profile-save"
            type="submit"
            disabled={props.isSubmitting || !props.canSave}
          >
            {props.isSubmitting ? "Saving..." : "Save changes"}
          </button>

          <button
            className="profile-cancel"
            type="button"
            onClick={props.onCancel}
            disabled={props.isSubmitting}
          >
            Cancel
          </button>
        </div>
        {/* could be implemented in the future 
        <div className="profile-subscription">
          <span className="profile-subscription-label">Subscription:</span>
          <span className="profile-subscription-value">{props.subscriptionText}</span>
        </div>
        
        <div className="profile-subscription-actions">
          <button
            className="profile-change-subscription"
            type="button"
            onClick={props.onChangeSubscription}
            disabled={props.isSubmitting}
          >
            Change Subscription
          </button>
        </div>*/}

        <div className="profile-logout-actions">
          <button
            className="profile-logout"
            type="button"
            onClick={props.onLogout}
            disabled={props.isSubmitting}
          >
            Logout
          </button>
        </div>
      </form>
    </div>
  );
}
