# README.md

- In the Google Cloud console, on the project selector page, create a Google Cloud project.
- [Make sure that billing is enabled for your Google Cloud project](https://cloud.google.com/billing/docs/how-to/verify-billing-enabled#confirm_billing_is_enabled_on_a_project).
- Enable the Cloud Functions, Cloud Run, Cloud Build, Artifact Registry, and Cloud Storage APIs.

  [Enable the APIs](https://console.cloud.google.com/flows/enableapi?apiid=cloudbuild.googleapis.com,run.googleapis.com,artifactregistry.googleapis.com,cloudfunctions.googleapis.com,storage.googleapis.com)
- Update `index.js` with your projects ID and region.

  ```javascript
  const projectId = 'google-project-id';
  const location = 'country-location';
  ```
- Run the script:

  ```bash
  node index.js
  ```
