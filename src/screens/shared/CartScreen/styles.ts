import { COLORS, FONTS, hp } from '@/theme/index';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clearBtnText: { color: '#e74c3c', fontSize: 14 },
  exploreBtn: { marginTop: 20, minWidth: 200 },
  clearAll: {
    fontSize: hp(1.2),
    fontFamily: FONTS.fontFamilySemiBold,
    color: COLORS.primary,
  },
  scroll: {
    paddingHorizontal: hp(1.9),
    paddingBottom: hp(4.7),
    paddingTop: hp(0.9),
  },
  // Customer Info Card
  customerInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: hp(1.6),
    padding: hp(1.9),
    marginBottom: hp(2.4),
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.charcoal,
    marginBottom: hp(1.4),
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: hp(9.4),
  },
  emptyText: {
    marginTop: hp(1.9),
    fontSize: hp(1.9),
    fontFamily: FONTS.fontFamilyRegular,
    color: COLORS.gray,
  },
  // Cart item
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.6),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    gap: hp(1.4),
  },
  productCover: {
    width: hp(8.5),
    height: hp(10.6),
    borderRadius: hp(0.9),
    justifyContent: 'center',
    alignItems: 'center',
    resizeMode: 'contain',
  },
  itemInfo: { flex: 1 },
  itemTitle: {
    fontSize: hp(1.6),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.charcoal,
    marginBottom: hp(0.5),
  },
  itemEdition: {
    fontSize: hp(1.3),
    fontFamily: FONTS.fontFamilyRegular,
    color: COLORS.gray,
    marginBottom: hp(0.5),
  },
  priceEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  priceLabel: {
    fontSize: hp(1.3),
    fontFamily: FONTS.fontFamilyMedium,
    color: COLORS.darkgray,
    marginRight: 5,
  },
  priceInputContainer: {
    width: hp(10),
    marginBottom: 0,
  },
  priceInput: {
    height: hp(4),
    paddingVertical: 0,
    fontSize: hp(1.5),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.primary,
  },
  currencyLabel: {
    fontSize: hp(1.2),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.darkgray,
    marginLeft: 5,
  },
  // Right side
  itemRight: {
    alignItems: 'center',
    gap: hp(1.2),
  },
  deleteBtn: { padding: hp(0.5) },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bordercolor,
    borderRadius: hp(0.9),
    overflow: 'hidden',
  },
  qtyBtn: {
    width: hp(3.3),
    height: hp(3.3),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  qtyText: {
    width: hp(3.3),
    textAlign: 'center',
    fontSize: hp(1.5),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.charcoal,
  },
  // Summary
  summaryBox: {
    backgroundColor: COLORS.white,
    borderRadius: hp(1.6),
    padding: hp(1.9),
    marginBottom: hp(2.4),
    marginTop: hp(2.4),
    gap: hp(1.4),
    borderWidth: 1,
    borderColor: COLORS.bordercolor,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: hp(1.5),
    fontFamily: FONTS.fontFamilyRegular,
    color: COLORS.darkgray,
  },
  summaryValue: {
    fontSize: hp(1.5),
    fontFamily: FONTS.fontFamilySemiBold,
    color: '#555',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray5,
    paddingTop: hp(1.4),
    marginTop: hp(0.5),
  },
  grandTotalLabel: {
    fontSize: hp(1.8),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.charcoal,
  },
  grandTotalValue: {
    fontSize: hp(2.4),
    fontFamily: FONTS.fontFamilyBold,
    color: COLORS.primary,
  },
});
