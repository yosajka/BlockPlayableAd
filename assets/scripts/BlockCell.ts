import { _decorator, Color, Component, EventMouse, EventTouch, Node, Sprite, Vec2, EventTarget } from 'cc';
import { GridCell } from './GridCell';
const { ccclass, property } = _decorator;

@ccclass('BlockCell')
export class BlockCell extends Component {
    @property(Vec2)
    coordinate: Vec2 = new Vec2();

    @property(GridCell) public gridCell: GridCell | null = null;
    public sprite: Sprite | null = null;

    public blockCellClicked = new EventTarget();
    public blockCellMoved = new EventTarget();
    public blockCellReleased = new EventTarget();

    onLoad(): void {
        // this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        // this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        // this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onTouchStart(event: EventMouse | EventTouch) {
        //console.log('onTouchStart');
        this.blockCellClicked.emit('blockCellClicked', this, event.getUILocation());
    }

    onTouchMove(event: EventMouse | EventTouch) {
        //console.log('onTouchMove');
        let touchPos = event.getLocation();
        this.blockCellMoved.emit('blockCellMoved', this, touchPos);
    }

    onTouchEnd(event: EventMouse | EventTouch) {
        //console.log('onTouchEnd');
        this.blockCellReleased.emit('blockCellReleased', this);
    }

    start() {
        this.sprite = this.getComponent(Sprite);
    }

    update(deltaTime: number) {
        if (this.gridCell != null) {
            const distance = Vec2.distance(this.node.getWorldPosition(), this.gridCell.node.getWorldPosition());
            if (distance > 25) {
                this.removeGridCell();
            }
        }
    }

    public setGridCell(cell: GridCell) {
        this.removeGridCell();
        this.gridCell = cell;
        cell.state = GridCell.STATE.HOVERED;
        
        cell.sprite.color = Color.BLUE;
    }

    removeGridCell() {
        if (this.gridCell != null) {
            this.gridCell.state = GridCell.STATE.EMPTY;
            const cellSprite = this.gridCell.getComponent(Sprite);
            if (cellSprite) {
                cellSprite.color = Color.WHITE;
                cellSprite.spriteFrame = this.gridCell.emptyTexture;
            }
            this.gridCell = null;
        }
    }

    // protected onDestroy(): void {
    //     this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    //     this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    //     this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    // }
}

