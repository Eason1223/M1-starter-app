# M1

## List of issues

### Issue 1: [User Deletion]

**Description**:[The Delete dialog’s confirm action never called the backend; it only cleared the local token via AuthViewModel and navigated away. Because DELETE /api/user/profile wasn’t invoked (and the base URL sometimes missed /api), the server account remained, leading to “User already exists” on re-sign-up. This also created client/server state drift (local sign-out while the server still had the user) and silent failures (no spinner/error surfaced).]

**How it was fixed?**: [Retrofit API: Added @DELETE("user/profile") suspend fun deleteProfile(): Response<Unit>; ensured API_BASE_URL = "http://10.0.2.2:3000/api/". Auth header sent via an OkHttp interceptor so DELETE is authenticated.

Repository seam: Implemented UserRepository.deleteAccount(): Result<Unit> that wraps the Retrofit call, normalizes errors (e.g., 401/500 → Result.Failure(msg)), and isolates I/O from UI.

ViewModel orchestration: Added ProfileViewModel.deleteAccount() to:
- set uiState.deleting = true (for button disable/spinner via StateFlow),
- call repository.deleteAccount() in a coroutine,
- on success → invoke auth.clearToken(), emit NavigateToSignIn,
- on failure → set uiState.error = message, deleting = false.

UI wiring: ProfileScreen.onDeleteDialogConfirm now calls profileViewModel.deleteAccount(...) and reacts to uiState:
- shows a progress indicator / disables Delete while deleting == true,
- shows a Snackbar on error,
- navigates only after the ViewModel emits success.

Observability & tests: Added Log.d at onClick/VM/repo to trace the call chain and verify DELETE /api/user/profile → 200 OK. Added a simple VM unit test with a mocked repo to cover success/failure paths.]

### Issue 2: [Profile Picture Update]

**Description**:[The photo-upload flow succeeded (200 OK) but the user’s avatar never changed. Root causes:

Frontend: ProfileViewModel.uploadProfilePicture() only mutated local UI; no real network call. The repo initially called a non-existent Retrofit method and didn’t reliably send the Bearer token or the correct multipart field name media.

Backend: POST /media/upload saved the file and returned { data.image } but did not persist the new path to the user’s record. An ObjectId vs string mismatch and the update validator excluded profilePicture, so even attempted writes were dropped. The server also returned a relative path not guaranteed to be publicly served.]

**How it was fixed?**: [Frontend

Added ProfileRepository.uploadProfilePicture(Uri) and implemented it to call ImageInterface.uploadPicture(...) with multipart part media and Authorization: Bearer <token>, then refetch getProfile() on success.

Updated ProfileViewModel.uploadProfilePicture() to call the repo, show loading, and set the returned user.

Backend

In uploadImage(): built an absolute URL (http://10.0.2.2:3000/uploads/...), converted user id string → ObjectId, and updated profilePicture via the user model.

Allowed profilePicture in the update schema and served /uploads statically so the app can load the image.

Result: Upload returns 200, DB now stores the new profilePicture URL, and subsequent GET /user/profile reflects the updated avatar in the app.]

### Issue 3: [Profile Bio Editing]

**Description**:[Bio couldn’t be edited because the parent Row blocked focus (focusProperties { canFocus = false }) and the OutlinedTextField was read-only.]

**How it was fixed?**:[Removed the focus-blocking Row and set OutlinedTextField readOnly = false, keeping onValueChange = data.onBioChange to update state.]

...
