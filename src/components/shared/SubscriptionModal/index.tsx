import CustomText from '@/components/shared/CustomText/index';
import GradientBtn from '@/components/shared/GradientBtn/index';
import LinearGradient from '@/components/shared/LinearGradient';
import { styles } from '@/components/shared/SubscriptionModal/styles';
import { COLORS, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Modal, TouchableOpacity, View } from 'react-native';

export default function SubscriptionModal({
  visible,
  onClose,
  onSubscribe,
}: {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
}) {
  return (
    <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="close" size={hp(2.5)} color={COLORS.gray} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primary300]}
              style={styles.iconGradient}
            >
              <Icon name="crown" size={hp(4.5)} color={COLORS.white} />
            </LinearGradient>
          </View>

          <CustomText style={styles.modalTitle}>Unlock Premium Access</CustomText>
          <CustomText style={styles.modalSubtitle}>
            Subscribe now to get unlimited access to all exclusive dental products and references.
          </CustomText>

          <View style={styles.featuresList}>
            {['Unlimited Products Access', 'Exclusive Medical References'].map((feat, i) => (
              <View key={i} style={styles.featureRow}>
                <Icon
                  name="check-circle"
                  size={hp(2)}
                  color={COLORS.secondary}
                  style={styles.featureIcon}
                />
                <CustomText style={styles.featureText}>{feat}</CustomText>
              </View>
            ))}
          </View>

          <GradientBtn
            text="Upgrade Now"
            onPress={onSubscribe}
            colors={[COLORS.primary, COLORS.primary300]}
            containerStyle={styles.subscribeBtn}
            textStyle={styles.subscribeBtnText}
          />

          <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
            <CustomText style={styles.skipBtnText}>Maybe Later</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
