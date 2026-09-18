import { COLORS, FONTS, hp, wp } from '@/theme/index';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    width: wp(45),
    backgroundColor: '#FFF',
    borderRadius: hp(1.9),
    marginBottom: hp(1.9),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: hp(17.1),
  },
  image: {
    width: '100%',
    height: '100%',
  },

  // Access Badge (top-left)
  accessBadge: {
    position: 'absolute',
    top: hp(0.9),
    left: hp(0.9),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: hp(0.8),
    paddingVertical: hp(0.4),
    borderRadius: hp(0.7),
  },
  freeBadge: {
    backgroundColor: '#10B981',
  },
  paidBadge: {
    backgroundColor: COLORS.primary,
  },
  accessBadgeText: {
    fontSize: hp(1.1),
    fontFamily: FONTS.fontFamilyBold,
    color: '#FFF',
    letterSpacing: 0.5,
  },

  // Price Tag (bottom-right)
  priceTag: {
    position: 'absolute',
    bottom: hp(0.9),
    right: hp(0.9),
    backgroundColor: 'rgba(28, 27, 26, 0.85)',
    paddingHorizontal: hp(0.9),
    paddingVertical: hp(0.5),
    borderRadius: hp(0.7),
  },
  priceText: {
    fontSize: hp(1.2),
    fontFamily: FONTS.fontFamilyBold,
    color: '#FFF',
  },

  info: {
    padding: hp(1.4),
  },
  title: {
    fontSize: hp(1.5),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.charcoal,
    marginBottom: 2,
  },
  author: {
    fontSize: hp(1.3),
    fontFamily: FONTS.fontFamilyMedium,
    color: '#888',
    marginBottom: 6,
  },
  desc: {
    fontSize: hp(1.2),
    fontFamily: FONTS.fontFamilyRegular,
    color: '#AAA',
    lineHeight: hp(1.6),
    marginBottom: hp(1.2),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: hp(1.3),
    fontFamily: FONTS.fontFamilySemiBold,
    color: COLORS.charcoal,
  },
  addBtn: {
    width: hp(3.3),
    height: hp(3.3),
    borderRadius: hp(0.9),
    backgroundColor: COLORS.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pricesContainer: {
    marginTop: hp(0.6),
    marginBottom: hp(0.6),
    paddingTop: hp(0.6),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  merchantPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  merchantPriceLabel: {
    fontSize: hp(1.15),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.primary,
  },
  merchantPriceValue: {
    fontSize: hp(1.35),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.primary,
  },
  suggestedPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestedPriceLabel: {
    fontSize: hp(1.05),
    fontFamily: FONTS.fontFamilyMedium,
    color: '#64748B',
  },
  suggestedPriceValue: {
    fontSize: hp(1.15),
    fontFamily: FONTS.fontFamilyBold,
    color: '#334155',
  },
});
