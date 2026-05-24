# E-mail Verification And Deliverability

The app now uses Firebase Auth verification e-mails for e-mail/password
accounts. A new account is signed out after sign-up, receives a verification
message, and cannot log in until Firebase reports `emailVerified: true`.

Google sign-in users are allowed through because the provider verifies the
address before Firebase creates the session.

## Firebase Console Checklist

1. In Firebase Authentication > Templates, keep the verification e-mail sender
   name recognizable, such as `Power Training Coach`.
2. In Firebase Authentication > Settings > Authorized domains, make sure the
   default Firebase auth domain and any production web domain are listed.
3. If you use a custom sender domain for Firebase/Auth e-mails, publish SPF,
   DKIM, and DMARC records for that domain before launch.
4. Keep the verification template short and transactional. Avoid marketing copy,
   link shorteners, attachments, all-caps subjects, and image-only content.
5. Test seed accounts at Gmail, Outlook, iCloud, and a private-domain mailbox
   before release.

No application code can guarantee inbox placement. Spam filtering is decided by
the receiver, but verified sender/domain records and predictable transactional
content give these e-mails the best chance of reaching the inbox.
