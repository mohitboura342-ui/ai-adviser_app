import { auth } from '../lib/firebase';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  let token = '';
  if (auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  } else if (localStorage.getItem('isGuest') === 'true') {
    token = 'guest';
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  return response;
}
