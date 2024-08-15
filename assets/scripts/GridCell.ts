import { _decorator, Component, Label, Node, Sprite, SpriteFrame, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GridCell')
export class GridCell extends Component {
    static STATE = {
        EMPTY: 0,
        HOVERED: 1,
        TAKEN: 2,
    };

    @property(Vec2)
    public coordinate: Vec2 = new Vec2();

    @property
    public state: number = GridCell.STATE.EMPTY;

    @property(SpriteFrame)
    public emptyTexture: SpriteFrame | null = null;

    @property(SpriteFrame)
    public initTexture: SpriteFrame | null = null;

    @property(Label)
    public label: Label | null = null;

    public sprite: Sprite | null = null;

    protected start(): void {
        this.sprite = this.getComponent(Sprite);
    }
}

