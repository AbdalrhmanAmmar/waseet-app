import { Dimensions } from 'react-native';
export const hp = (value: number | string) =>
  (Dimensions.get('window').height * Number.parseFloat(String(value))) / 100;
export const wp = (value: number | string) =>
  (Dimensions.get('window').width * Number.parseFloat(String(value))) / 100;
