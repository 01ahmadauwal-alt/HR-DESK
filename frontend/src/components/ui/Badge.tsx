import { STATUS_BADGE, capitalize } from '../../utils/formatters';

export default function Badge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status] ?? 'badge-gray';
  return <span className={cls}>{capitalize(status)}</span>;
}
