import { styles } from '@/components/shared/GuestViewComponent/styles';
import CustomText from '../CustomText';
import GradientBtn from '../GradientBtn';
import { ScreenNames } from '@/navigation/ScreenNames';
import { useScreenProps } from '@/navigation/use-screen-props';
import { COLORS, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';

export default function GuestViewComponent() {
  const { navigation } = useScreenProps();
  return (
    <View style={styles.emptyContainer}>
      <Icon name="account-off" size={hp(7.5)} color="#DDD" />
      <CustomText style={styles.emptyText}>Your are not logged in</CustomText>
      <GradientBtn
        text={'Login'}
        onPress={() => navigation.navigate(ScreenNames.AuthStack, { screen: ScreenNames.Login })}
        colors={[COLORS.primary, '#126B57']}
        leftIcon={<Icon name="check-circle-outline" size={hp(2.1)} color={COLORS.white} />}
      />
    </View>
  );
}
