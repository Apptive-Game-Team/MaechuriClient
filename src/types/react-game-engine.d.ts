declare module 'react-game-engine' {
  import { Component, CSSProperties, ElementType } from 'react';

  export interface Entity {
    [key: string]: any;
    renderer?: ElementType;
  }

  export interface GameEngineUpdateEvent {
    touches: any[];
    screen: {
      width: number;
      height: number;
    };
    time: {
      current: number;
      delta: number;
      elapsed: number;
    };
    dispatch: (event: any) => void;
    events: any[];
  }

  export type System = (entities: Record<string, Entity>, update: GameEngineUpdateEvent) => Record<string, Entity>;

  export interface GameEngineProps {
    systems?: Array<System>;
    entities?: Record<string, Entity>;
    style?: CSSProperties;
    running?: boolean;
    onEvent?: (event: Record<string, any>) => void;
    children?: React.ReactNode;
  }

  export class GameEngine extends Component<GameEngineProps> {
    dispatch(event: { type: string; [key: string]: any; }): void;
  }
}
