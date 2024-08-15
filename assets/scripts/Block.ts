import { _decorator, Color, Component, EventMouse, EventTarget, EventTouch, Input, input, log, Node, Prefab, Sprite, UITransform, Vec2, Vec3 } from 'cc';
import { GridCell } from './GridCell';
import { BlockCell } from './BlockCell';
const { ccclass, property } = _decorator;

@ccclass('Block')
export class Block extends Component {
    @property(Prefab)
    combo: Prefab | null = null;

    public yCoord: number[] = [];
    public xCoord: number[] = [];
    public dragging: boolean = false;
    private dragOffset: Vec3 = new Vec3(0, 5, 0);
    @property(BlockCell) public grids: BlockCell[] = [];
    public initPosition: Vec3 = new Vec3();


    // Events
    public blockClicked = new EventTarget();
    public blockPlaced = new EventTarget();
    public blockReleased = new EventTarget();

    start() {
        this.initPosition = this.node.worldPosition.clone();
        this.node.children.forEach(child => {
            const blockCell = child.getComponent(BlockCell);
            if (blockCell) {
                this.grids.push(blockCell);
            }
        });

        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onTouchStart, this);
    }

    update(deltaTime: number) {
        // Empty update function
    }

    onTouchStart(event: EventMouse | EventTouch) {
        // if (this.node.parent.getComponent('GameManager').isTutorial) {
        //     return;
        // }
        
        
        const touchPos = event.getUILocation();
        for (const grid of this.grids) {
            const rect = grid.getComponent(UITransform).getBoundingBoxToWorld();
            if (rect.contains(new Vec2(touchPos.x, touchPos.y))) {
                this.dragging = true;
                const worldPos = this.node.worldPosition;
                this.dragOffset = new Vec3(worldPos.x - touchPos.x, worldPos.y - touchPos.y, worldPos.z);
                this.blockClicked.emit('blockClicked', this);
                break;
            }
        }
    }

    onTouchMove(event: EventMouse | EventTouch) {
        if (this.dragging) {
            const touchPos = event.getUILocation();
            const newPos = new Vec3(
                touchPos.x + this.dragOffset.x,
                touchPos.y + this.dragOffset.y + 100,
                this.node.worldPosition.z
            );
            this.node.worldPosition = newPos;
        }
    }

    onTouchEnd(event: EventMouse | EventTouch) {
        if (this.dragging) {
            if (this.canPlace()) {
                for (const cell of this.grids) {
                    cell.gridCell.sprite.spriteFrame = cell.sprite.spriteFrame;
                    cell.gridCell.initTexture = cell.sprite.spriteFrame;
                    cell.gridCell.sprite.color = Color.WHITE;
                    cell.gridCell.state = GridCell.STATE.TAKEN;
                }
                this.blockPlaced.emit('blockPlaced', this);
            } else {
                this.node.worldPosition = this.initPosition;
                this.blockReleased.emit('blockReleased', this);
            }
            this.dragging = false;
        }
    }

    getYCoord() {
        this.yCoord = [];
        for (const blockCell of this.grids) {
            const y = Math.floor(blockCell.gridCell.coordinate.y);
            if (this.yCoord.indexOf(y) === -1) {
                this.yCoord.push(y);
            }
        }
    }

    getXCoord() {
        this.xCoord = [];
        for (const blockCell of this.grids) {
            const x = Math.floor(blockCell.gridCell.coordinate.x);
            if (this.xCoord.indexOf(x) === -1) {
                this.xCoord.push(x);
            }
        }
    }

    canPlace(): boolean {
        return this.grids.every(x => x.gridCell != null);
    }
}

