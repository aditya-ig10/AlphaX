import axios from 'axios';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const API_KEY = 'AIzaSyCLeKz1ovYIgXSyvWur_q8k0h0I0DxEyMs';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const fetchCurrentlyPlaying = async (accessToken: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'snippet',
        chart: 'mostPopular',
        videoCategoryId: '10', 
        maxResults: 1,
        key: API_KEY,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].snippet.title;
    }
    return null;
  } catch (error) {
    console.error('Error fetching currently playing song:', error);
    return null;
  }
};