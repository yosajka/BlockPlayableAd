import { _decorator, Camera, Color, Component, EventMouse, EventTarget, EventTouch, Input, input, Node, Prefab, UITransform, Vec2, Vec3 } from 'cc';
import { GridCell } from './GridCell';
import { BlockCell } from './BlockCell';
const { ccclass, property } = _decorator;

@ccclass('Block')
export class Block extends Component {
    @property(Prefab)
    public combo: Prefab | null = null;

    public yCoord: number[] = [];
    public xCoord: number[] = [];
    public dragging: boolean = false;
    private dragOffset: Vec3 = new Vec3(0, 5, 0);
    @property(BlockCell) public grids: BlockCell[] = [];
    @property(Vec3) public initPosition: Vec3 = new Vec3();
    @property(Vec3) public portraitPosition: Vec3 = new Vec3();
    @property(Vec3) public landscapePosition: Vec3 = new Vec3();
    @property(Camera) public camera: Camera;

    // Events
    public blockClicked = new EventTarget();
    public blockPlaced = new EventTarget();
    public blockReleased = new EventTarget();

    start() {
        //this.initPosition = this.node.worldPosition.clone();
        this.node.children.forEach(child => {
            const blockCell = child.getComponent(BlockCell);
            if (blockCell) {
                this.grids.push(blockCell);
                // blockCell.blockCellClicked.on('blockCellClicked', this.onBlockCellClicked, this);
                // blockCell.blockCellMoved.on('blockCellMoved', this.onBlockCellMoved, this);
                // blockCell.blockCellReleased.on('blockCellReleased', this.onBlockCellReleased, this);
            }
        });

        //this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        //this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        //input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        //input.on(Input.EventType.MOUSE_DOWN, this.onTouchStart, this);
    }

    update(deltaTime: number) {
        // Empty update function
    }

    onBlockCellClicked(blockCell: BlockCell, touchPos: Vec2) {
        if (this.grids.indexOf(blockCell) === -1) {
            return;
        }
        this.dragging = true;
        const worldPos = this.node.worldPosition;
        //this.dragOffset = new Vec3(worldPos.x - touchPos.x, worldPos.y - touchPos.y, worldPos.z);
        this.blockClicked.emit('blockClicked', this);
    }

    onBlockCellMoved(blockCell: BlockCell, touchPos: Vec2) {
        if (this.dragging) {
            let newTPos = this.camera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0));
            const newPos = new Vec3(
                newTPos.x + this.dragOffset.x,
                newTPos.y + this.dragOffset.y + 100,
                this.node.worldPosition.z
            );
            this.node.worldPosition = newPos;
        }
    }

    onBlockCellReleased(blockCell: BlockCell) {
        console.log('Released');
        if (this.dragging) {
            if (this.canPlace()) {
                for (const cell of this.grids) {
                    cell.gridCell.sprite.spriteFrame = cell.sprite.spriteFrame;
                    cell.gridCell.initTexture = cell.sprite.spriteFrame;
                    cell.gridCell.sprite.color = Color.WHITE;
                    cell.gridCell.state = GridCell.STATE.TAKEN;
                }
                this.blockPlaced.emit('blockPlaced', this, this.combo, this.node.position, this.node.name);
            } else {
                this.node.position = this.initPosition;
                this.blockReleased.emit('blockReleased', this);
            }
            this.dragging = false;
        }
    }

    onTouchStart(event: EventMouse | EventTouch) {
        const touchPos = this.camera.screenToWorld(new Vec3(event.getLocation().x, event.getLocation().y, 0));
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
            const touchPos = this.camera.screenToWorld(new Vec3(event.getLocation().x, event.getLocation().y, 0));
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
                this.blockPlaced.emit('blockPlaced', this, this.combo, this.node.position, this.node.name);
            } else {
                this.node.position = this.initPosition;
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

