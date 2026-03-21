package com.powertraining.coach.googleauth

import android.app.Activity
import androidx.core.content.ContextCompat
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialManagerCallback
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential

class GoogleCredentialManagerModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "PowerTrainingGoogleAuth"

  @ReactMethod
  fun signIn(options: ReadableMap, promise: Promise) {
    val activity = currentActivity

    if (activity == null) {
      promise.reject(
        "E_GOOGLE_ACTIVITY_UNAVAILABLE",
        "Google sign-in requires an active Android activity."
      )
      return
    }

    val serverClientId = options.getString("serverClientId")?.trim()
    if (serverClientId.isNullOrEmpty()) {
      promise.reject(
        "E_GOOGLE_MISSING_SERVER_CLIENT_ID",
        "Google sign-in is not configured for this Android build. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID."
      )
      return
    }

    val mode = options.getString("mode") ?: "signin"
    val filterByAuthorizedAccounts = mode != "signup"

    requestGoogleCredential(
      activity = activity,
      serverClientId = serverClientId,
      filterByAuthorizedAccounts = filterByAuthorizedAccounts,
      allowRetryWithoutFilter = filterByAuthorizedAccounts,
      promise = promise,
    )
  }

  @ReactMethod
  fun clearCredentialState(promise: Promise) {
    val credentialManager = CredentialManager.create(reactContext)
    val executor = ContextCompat.getMainExecutor(reactContext)

    credentialManager.clearCredentialStateAsync(
      ClearCredentialStateRequest(),
      null,
      executor,
      object : CredentialManagerCallback<Void?, ClearCredentialException> {
        override fun onResult(result: Void?) {
          promise.resolve(null)
        }

        override fun onError(e: ClearCredentialException) {
          promise.reject(
            "E_GOOGLE_CLEAR_CREDENTIAL_STATE",
            e.message ?: "Could not clear Google credential state.",
            e,
          )
        }
      },
    )
  }

  private fun requestGoogleCredential(
    activity: Activity,
    serverClientId: String,
    filterByAuthorizedAccounts: Boolean,
    allowRetryWithoutFilter: Boolean,
    promise: Promise,
  ) {
    val option = GetGoogleIdOption.Builder()
      .setServerClientId(serverClientId)
      .setFilterByAuthorizedAccounts(filterByAuthorizedAccounts)
      .setAutoSelectEnabled(false)
      .build()

    val request = GetCredentialRequest.Builder()
      .addCredentialOption(option)
      .build()

    val credentialManager = CredentialManager.create(activity)
    val executor = ContextCompat.getMainExecutor(activity)

    credentialManager.getCredentialAsync(
      activity,
      request,
      null,
      executor,
      object : CredentialManagerCallback<GetCredentialResponse, GetCredentialException> {
        override fun onResult(result: GetCredentialResponse) {
          handleCredentialResponse(result, promise)
        }

        override fun onError(e: GetCredentialException) {
          if (e is NoCredentialException && allowRetryWithoutFilter) {
            requestGoogleCredential(
              activity = activity,
              serverClientId = serverClientId,
              filterByAuthorizedAccounts = false,
              allowRetryWithoutFilter = false,
              promise = promise,
            )
            return
          }

          promise.reject(
            mapErrorCode(e),
            mapErrorMessage(e),
            e,
          )
        }
      },
    )
  }

  private fun handleCredentialResponse(
    response: GetCredentialResponse,
    promise: Promise,
  ) {
    val credential = response.credential

    if (
      credential is CustomCredential &&
      (
        credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL ||
          credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_SIWG_CREDENTIAL
        )
    ) {
      try {
        val googleCredential = GoogleIdTokenCredential.createFrom(credential.data)
        val idToken = googleCredential.idToken

        if (idToken.isBlank()) {
          promise.reject(
            "E_GOOGLE_ID_TOKEN_MISSING",
            "Google sign-in did not return an ID token."
          )
          return
        }

        val result = Arguments.createMap()
        result.putString("idToken", idToken)
        promise.resolve(result)
        return
      } catch (error: Exception) {
        promise.reject(
          "E_GOOGLE_ID_TOKEN_PARSE",
          error.message ?: "Could not parse the Google ID token.",
          error,
        )
        return
      }
    }

    promise.reject(
      "E_GOOGLE_UNEXPECTED_CREDENTIAL",
      "Google sign-in returned an unsupported credential type.",
    )
  }

  private fun mapErrorCode(error: GetCredentialException): String =
    when (error) {
      is GetCredentialCancellationException -> "E_GOOGLE_CANCELED"
      is NoCredentialException -> "E_GOOGLE_NO_CREDENTIAL"
      else -> "E_GOOGLE_SIGN_IN_FAILED"
    }

  private fun mapErrorMessage(error: GetCredentialException): String =
    when (error) {
      is GetCredentialCancellationException -> "Google sign-in was canceled."
      is NoCredentialException ->
        "No Google account could be used on this device. On an emulator, sign in to Google in the Play Store or in Settings > Passwords & accounts."
      else -> error.message ?: "Google sign-in failed."
    }
}
