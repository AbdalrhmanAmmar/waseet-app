import CustomText from '@/components/shared/CustomText/index';
import GradientBtn from '@/components/shared/GradientBtn/index';
import { COLORS, hp, wp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Modal, StatusBar, StyleSheet, View } from 'react-native';

const NetworkStatusModal = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected !== false && state.isInternetReachable !== false);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== false && state.isInternetReachable !== false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRetry = () => {
    // alert('Retry');
    setIsLoading(true);
    NetInfo.refresh().then((state) => {
      setIsConnected(state.isConnected !== false && state.isInternetReachable !== false);
      setTimeout(() => {
        setIsLoading(false);
      }, 200);
    });
  };

  return (
    <Modal visible={!isConnected} transparent={false} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        <StatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="wifi-off" size={hp(10)} color={COLORS.primary} />
          </View>
          <CustomText style={styles.title}>لا يوجد اتصال بالإنترنت</CustomText>
          <CustomText style={styles.description}>
            تحقق من اتصال الإنترنت ثم حاول مرة أخرى.
          </CustomText>

          <GradientBtn
            text="إعادة المحاولة"
            onPress={handleRetry}
            disabled={isLoading}
            isLoading={isLoading}
            colors={[COLORS.primary, COLORS.charcoal]}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: hp(4),
    padding: hp(4),
    borderRadius: hp(10),
    backgroundColor: COLORS.lightGray,
  },
  title: {
    fontSize: hp(2.8),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: hp(2),
    textAlign: 'center',
    fontFamily: 'Montserrat-Bold',
  },
  description: {
    fontSize: hp(1.8),
    color: COLORS.darkGray2 || '#4B5563',
    textAlign: 'center',
    lineHeight: hp(2.5),
    marginBottom: hp(5),
    fontFamily: 'Montserrat-Regular',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: wp(15),
    paddingVertical: hp(1.8),
    borderRadius: hp(1.2),
    width: '100%',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  retryText: {
    color: COLORS.white,
    fontSize: hp(2),
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
});

export default NetworkStatusModal;
