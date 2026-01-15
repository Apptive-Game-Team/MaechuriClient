declare module 'react-game-engine' {
  import { Component, CSSProperties, ElementType } from 'react';

  export interface Entity {
    [key: string]: unknown;
    renderer?: ElementType;
  }

  export type System = (entities: Record<string, Entity>, args: Record<string, unknown>) => Record<string, Entity>;

  export interface GameEngineProps {
    systems?: Array<System>;
    entities?: Record<string, Entity>;
    style?: CSSProperties;
    running?: boolean;
    onEvent?: (event: Record<string, unknown>) => void;
    children?: React.ReactNode;
  }

  export class GameEngine extends Component<GameEngineProps> {
    dispatch(event: { type: string; [key: string]: unknown; }): void;
  }
}
