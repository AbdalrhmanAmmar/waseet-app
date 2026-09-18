import { styles } from '@/components/shared/HeaderComponent/styles';
import { useScreenProps } from '@/navigation/use-screen-props';
import { COLORS, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
type HeaderComponentProps = {
  title?: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  showBack?: boolean;
  containerStyle?: any;
};

const HeaderComponent: React.FC<HeaderComponentProps> = ({
  title,
  onBack,
  rightComponent,
  showBack = true,
  containerStyle,
}) => {
  const { navigation } = useScreenProps();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <Icon name="chevron-right" size={hp(2.8)} color={COLORS.charcoal} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.right}>
        {rightComponent ? rightComponent : <View style={{ width: hp(4.7) }} />}
      </View>
    </View>
  );
};

export default HeaderComponent;
