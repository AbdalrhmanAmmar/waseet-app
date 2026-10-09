import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import {
  useCreateOrderIssueMutation,
  useOrderIssuesQuery,
  useResolveOrderIssueMutation,
} from '@/api/shared/order-issues';
import { errorMessage } from '@/api/normalizers';
import {
  canResolveOrderIssue,
  issueActorLabel,
  issueStatusPresentation,
  orderIssueEligibility,
  orderIssueResolutionSchema,
  orderIssueSchema,
  positiveIssueId,
} from '@/domain/order-issues';
import type { DeliveryMode } from '@/domain/order-workflow';
import { useSession } from '@/hooks/shared/use-session';
import type { Order, OrderIssue } from '@/types/models';
import { palette as p, typography as t } from '@/theme/tokens';
import Text from '../CustomText';
import { AsyncState } from '../AsyncState';
import { Button, Card, ui } from '../ui';

type Editor = { type: 'create' } | { type: 'resolve'; issue: OrderIssue } | null;

const displayDate = (value: string | null) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleString('ar-EG')
    : 'التاريخ غير متوفر';
};

const statusColors = {
  open: { backgroundColor: '#FFF1E2', color: '#9A5A19' },
  working: { backgroundColor: '#EAF3FC', color: '#25689B' },
  resolved: { backgroundColor: '#E5F6EF', color: '#147D64' },
  neutral: { backgroundColor: '#EEF1EF', color: '#677A70' },
};

export function OrderIssuesPanel({ order, mode }: { order: Order; mode: DeliveryMode }) {
  const { can } = useSession();
  const mayCreate = can('orders.issues.create');
  const mayResolve = can('orders.issues.resolve');
  const query = useOrderIssuesQuery(order.orderId, { refetchOnMountOrArgChange: true });
  const [createIssue, createResult] = useCreateOrderIssueMutation();
  const [resolveIssue, resolveResult] = useResolveOrderIssueMutation();
  const [visibleCount, setVisibleCount] = useState(5);
  const [editor, setEditor] = useState<Editor>(null);
  const [note, setNote] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [notice, setNotice] = useState('');
  const eligibility = orderIssueEligibility(order, mode);
  const issues = query.currentData ?? [];
  const busy = createResult.isLoading || resolveResult.isLoading;
  const mutationError = createResult.error ?? resolveResult.error;

  const closeEditor = () => {
    if (busy) return;
    setEditor(null);
    setNote('');
    setFieldError('');
    createResult.reset();
    resolveResult.reset();
  };
  const openEditor = (next: Exclude<Editor, null>) => {
    if (next.type === 'create' && (!mayCreate || !eligibility.allowed)) return;
    if (next.type === 'resolve' && (!mayResolve || !canResolveOrderIssue(next.issue))) return;
    setEditor(next);
    setNote('');
    setFieldError('');
    setNotice('');
    createResult.reset();
    resolveResult.reset();
  };
  const submit = async () => {
    if (!editor || busy) return;
    if (editor.type === 'create') {
      const parsed = orderIssueSchema.safeParse({ note });
      if (!parsed.success) {
        setFieldError(parsed.error.issues[0]?.message ?? 'اكتب وصف المشكلة قبل الحفظ');
        return;
      }
      try {
        await createIssue({
          orderId: order.orderId,
          note: parsed.data.note,
          deliveryMode: mode,
        }).unwrap();
        setNotice('تم تسجيل المشكلة وربطها بالطلب.');
        closeEditor();
      } catch {
        // RTK Query exposes the localized error below and keeps the entered note.
      }
      return;
    }
    const issueId = positiveIssueId(editor.issue.orderIssueId);
    const parsed = orderIssueResolutionSchema.safeParse({ issueId, resolutionNote: note });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'اكتب ملاحظة الحل قبل الحفظ');
      return;
    }
    try {
      await resolveIssue({
        orderId: order.orderId,
        issueId: parsed.data.issueId,
        resolutionNote: parsed.data.resolutionNote,
      }).unwrap();
      setNotice('تم حل المشكلة وحفظ ملاحظة الحل.');
      closeEditor();
    } catch {
      // The dialog remains open so the note and recovery message are preserved.
    }
  };

  return (
    <>
      <Card>
        <View style={s.heading}>
          <View style={s.headingText}>
            <Text style={ui.title}>مشكلات الطلب</Text>
            <Text style={ui.caption}>المشكلات المسجلة وملاحظات متابعتها</Text>
          </View>
          <View style={s.headingIcon}>
            <Icon name="message-alert-outline" size={26} color={p.primary} />
          </View>
        </View>
        {query.currentData !== undefined && <Text style={ui.caption}>{issues.length} مشكلات</Text>}
        <Button
          title="تحديث مشكلات الطلب"
          icon="refresh"
          secondary
          loading={query.isFetching && !query.isLoading}
          onPress={() => void query.refetch()}
        />
        <AsyncState
          loading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        />
        {!!notice && (
          <View style={s.notice}>
            <Icon name="check-circle-outline" size={20} color={p.primary} />
            <Text accessibilityLiveRegion="polite" style={s.noticeText}>
              {notice}
            </Text>
          </View>
        )}
        {issues.slice(0, visibleCount).map((issue, index) => {
          const presentation = issueStatusPresentation(issue.status);
          const colors = statusColors[presentation.tone];
          return (
            <View
              key={`${issue.orderIssueId ?? 'issue'}-${index}`}
              style={s.issue}
              accessibilityLabel={`مشكلة ${issue.orderIssueId ?? index + 1}`}
            >
              <View style={s.issueHeader}>
                <Text style={s.issueTitle}>
                  مشكلة{issue.orderIssueId !== null ? ` #${issue.orderIssueId}` : ''}
                </Text>
                <View style={[s.badge, { backgroundColor: colors.backgroundColor }]}>
                  <Text style={[s.badgeText, { color: colors.color }]}>{presentation.label}</Text>
                </View>
              </View>
              <Text style={ui.caption}>
                {issueActorLabel(issue) ? `سجّلها: ${issueActorLabel(issue)} · ` : ''}
                {displayDate(issue.createdAt)}
              </Text>
              <Text style={s.issueNote}>{issue.note}</Text>
              {(issue.resolutionNote || issue.resolvedAt) && (
                <View style={s.resolution}>
                  {!!issue.resolutionNote && (
                    <>
                      <Text style={s.resolutionTitle}>ملاحظة الحل</Text>
                      <Text>{issue.resolutionNote}</Text>
                    </>
                  )}
                  {!!issue.resolvedByName && (
                    <Text style={ui.caption}>حلّها: {issue.resolvedByName}</Text>
                  )}
                  {!!issue.resolvedAt && (
                    <Text style={ui.caption}>تاريخ الحل: {displayDate(issue.resolvedAt)}</Text>
                  )}
                </View>
              )}
              {mayResolve && canResolveOrderIssue(issue) && (
                <Button
                  title="حل المشكلة"
                  icon="check-circle-outline"
                  secondary
                  onPress={() => openEditor({ type: 'resolve', issue })}
                />
              )}
            </View>
          );
        })}
        {!query.isLoading && !query.error && !issues.length && (
          <View style={s.empty}>
            <Icon name="message-alert-outline" size={34} color={p.muted} />
            <Text style={s.emptyTitle}>لا توجد مشكلات مسجلة لهذا الطلب</Text>
            <Text style={ui.caption}>يمكنك إضافة مشكلة بعد اكتمال تسليم الطلب.</Text>
          </View>
        )}
        {issues.length > 5 && (
          <Button
            title={visibleCount >= issues.length ? 'عرض أقل' : 'عرض المزيد من المشكلات'}
            secondary
            onPress={() => setVisibleCount(visibleCount >= issues.length ? 5 : visibleCount + 5)}
          />
        )}
        {mayCreate && (
          <>
            <Button
              title="تسجيل مشكلة"
              icon="message-plus-outline"
              disabled={!eligibility.allowed}
              onPress={() => openEditor({ type: 'create' })}
            />
            {!eligibility.allowed && <Text style={ui.caption}>{eligibility.reason}</Text>}
          </>
        )}
      </Card>

      <Modal visible={!!editor} transparent animationType="slide" onRequestClose={closeEditor}>
        <KeyboardAvoidingView
          style={s.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeEditor} />
          <View style={s.sheet} accessibilityViewIsModal>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.sheetContent}>
              <View style={s.handle} />
              <Text style={ui.title}>
                {editor?.type === 'create' ? 'تسجيل مشكلة' : 'حل المشكلة'}
              </Text>
              <Text style={ui.caption}>
                {editor?.type === 'create'
                  ? 'أضف وصفًا واضحًا يساعد فريق المتابعة على فهم المشكلة والتعامل معها.'
                  : 'راجع المشكلة وأضف ملاحظة توضّح الإجراء المتخذ.'}
              </Text>
              {editor?.type === 'resolve' && (
                <View style={s.context}>
                  <Text style={s.resolutionTitle}>مشكلة #{editor.issue.orderIssueId ?? '—'}</Text>
                  <Text>{editor.issue.note}</Text>
                </View>
              )}
              {editor?.type === 'create' && (
                <View style={s.warning}>
                  <Icon name="alert-outline" size={22} color="#9A5A19" />
                  <Text style={s.warningText}>
                    تسجيل المشكلة يضيفها إلى المتابعة، ولا يغيّر حالة الطلب تلقائيًا.
                  </Text>
                </View>
              )}
              <Text style={s.label}>
                {editor?.type === 'create' ? 'وصف المشكلة' : 'ملاحظة الحل'} *
              </Text>
              <TextInput
                accessibilityLabel={
                  editor?.type === 'create' ? 'وصف مشكلة الطلب' : 'ملاحظة حل المشكلة'
                }
                value={note}
                onChangeText={(value) => {
                  setNote(value);
                  setFieldError('');
                  createResult.reset();
                  resolveResult.reset();
                }}
                editable={!busy}
                multiline
                maxLength={500}
                placeholder={
                  editor?.type === 'create'
                    ? 'اشرح المشكلة وما الذي حدث…'
                    : 'ما الإجراء الذي تم اتخاذه لحل المشكلة؟'
                }
                placeholderTextColor={p.muted}
                style={[s.input, fieldError && { borderColor: p.danger }]}
              />
              <Text style={ui.caption}>{note.length} / 500 · من 5 إلى 500 حرف</Text>
              {!!fieldError && (
                <Text accessibilityRole="alert" style={s.error}>
                  {fieldError}
                </Text>
              )}
              {!!mutationError && (
                <Text accessibilityRole="alert" style={s.error}>
                  {errorMessage(mutationError)}
                </Text>
              )}
              <Button
                title={editor?.type === 'create' ? 'حفظ المشكلة' : 'تأكيد الحل'}
                loading={busy}
                disabled={!note.trim()}
                onPress={() => void submit()}
              />
              <Button title="إلغاء" secondary disabled={busy} onPress={closeEditor} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  heading: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  headingText: { flex: 1, gap: 2 },
  headingIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: p.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  issue: { borderTopWidth: 1, borderColor: p.border, paddingTop: 16, gap: 10 },
  issueHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  issueTitle: { flex: 1, color: p.ink, fontFamily: t.bold, fontSize: 17 },
  issueNote: { color: p.ink, lineHeight: 24 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontFamily: t.bold, fontSize: 12 },
  resolution: { backgroundColor: p.soft, borderRadius: 14, padding: 12, gap: 6 },
  resolutionTitle: { color: p.deep, fontFamily: t.bold },
  empty: { alignItems: 'center', paddingVertical: 18, gap: 8 },
  emptyTitle: { color: p.ink, fontFamily: t.bold, textAlign: 'center' },
  notice: {
    flexDirection: 'row-reverse',
    gap: 8,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: p.soft,
  },
  noticeText: { flex: 1, color: p.primary, fontFamily: t.medium },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0007' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: p.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: { padding: 20, paddingBottom: 32, gap: 14 },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: p.border,
    alignSelf: 'center',
  },
  context: { backgroundColor: p.surface, borderRadius: 16, padding: 14, gap: 8 },
  warning: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: p.warm,
    borderRadius: 14,
    padding: 12,
  },
  warningText: { flex: 1, color: '#7A481B', lineHeight: 22 },
  label: { color: p.ink, fontFamily: t.bold, fontSize: 16 },
  input: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 16,
    backgroundColor: p.surface,
    padding: 14,
    color: p.ink,
    fontFamily: t.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
    textAlignVertical: 'top',
  },
  error: { color: p.danger, lineHeight: 22 },
});
