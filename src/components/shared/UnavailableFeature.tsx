import { HeaderComponent, ScreenContainer } from './index';
import { AsyncState } from './AsyncState';
export function UnavailableFeature({ title, message }: { title: string; message: string }) {
  return (
    <ScreenContainer>
      <HeaderComponent title={title} />
      <AsyncState empty={message} />
    </ScreenContainer>
  );
}
