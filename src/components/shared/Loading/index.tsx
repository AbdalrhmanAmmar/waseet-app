import images from '@/theme/images';
import { COLORS, wp } from '@/theme/index';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as Animatable from 'react-native-animatable';

const Loading = ({ style }: { style?: any }) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={26} color={COLORS.mainOrange} style={styles.activityIndicator} />
      <Animatable.Image
        animation="pulse"
        duration={1500}
        iterationCount="infinite"
        source={images.logoSelling}
        style={styles.logo}
        useNativeDriver
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  activityIndicator: {
    position: 'absolute',
    transform: [{ scale: 3.5 }],
  },
  logo: {
    width: wp(20),
    height: wp(20),
    resizeMode: 'contain',
    backgroundColor: COLORS.white,
    borderRadius: wp(10),
  },
});

export default Loading;
