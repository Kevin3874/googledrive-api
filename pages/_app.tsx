import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useState } from 'react';
import {GoogleLogin, GoogleLogout} from 'react-google-login';
const { google } = require('googleapis');
const CLIENT_ID = '';
const CLIENT_SECRET = ''
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = ''
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
const [accessToken, setAccessToken] = useState<string>('');
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const handleLoginSuccess = (response: any) => {
  setAccessToken(response.accessToken);
  oAuth2Client.setCredentials({access_token: response.accessToken});
};

const handleLogoutSuccess = () => {
  setAccessToken('');
};

const listFiles = async () => {
  const drive = google.drive({version: 'v3', auth: accessToken});
  const response = await drive.files.list();
  console.log(response.data.files);
};

const downloadFile = async (fileId: string) => {
  const drive = google.drive({version: 'v3', auth: accessToken});
  const response = await drive.files.get({fileId, alt: 'media'}, {responseType: 'blob'});
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileId}.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const listFileUsers = async (fileId: string) => {
  const drive = google.drive({version: 'v3', auth: accessToken});
  const response = await drive.permissions.list({fileId});
  console.log(response.data.permissions);
};

const createPushNotification = async (fileId: string) => {
  const drive = google.drive({version: 'v3', auth: accessToken});
  const channel = {
    id: 'unique-channel-id',
    type: 'web_hook',
    address: 'http://localhost:3000/api/notifications'
  };
  const {data: {expiration, resourceId}} = await drive.files.watch({
    fileId,
    requestBody: channel
  });
  console.log(`Watch channel created for file ${fileId}, expiration: ${expiration}, resourceId: ${resourceId}`);
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="App">
      {!accessToken ? (
        <GoogleLogin
          clientId={CLIENT_ID}
          buttonText="Login with Google"
          onSuccess={handleLoginSuccess}
          onFailure={handleLoginFailure}
          cookiePolicy="single_host_origin"
          responseType="code,token"
        />
      ) : (
        <>
          <GoogleLogout
            clientId={CLIENT_ID}
            buttonText="Logout"
            onLogoutSuccess={handleLogoutSuccess}
          />
          <div>
            <button onClick={listFiles}>List Files</button>
          </div>
          {files && (
            <div>
              <h3>Files:</h3>
              <ul>
                {files.map((file) => (
                  <li key={file.id}>
                    {file.name}
                    <button onClick={() => downloadFile(file.id)}>
                      Download
                    </button>
                    <button onClick={() => listFileUsers(file.id)}>
                      List Users
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selectedFile && (
            <div>
              <h3>Users with access to {selectedFile.name}:</h3>
              {fileUsers && (
                <ul>
                  {fileUsers.map((user) => (
                    <li key={user.emailAddress}>{user.emailAddress}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
