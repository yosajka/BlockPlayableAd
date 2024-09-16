import { _decorator, Camera, Canvas, Color, Component, EventMouse, EventTarget, EventTouch, Input, input, log, Node, Prefab, Sprite, UITransform, Vec2, Vec3 } from 'cc';
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

    // Events
    public blockClicked = new EventTarget();
    public blockPlaced = new EventTarget();
    public blockReleased = new EventTarget();
    @property(Canvas) public canvas: Canvas;

    start() {
        //this.initPosition = this.node.worldPosition.clone();
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
        // const touchPos = event.getUILocation();

        // // Get the active camera in the scene (assuming the default camera for UI rendering)
        // const camera = this.canvas.getComponent(UITransform).node.scene.getComponentInChildren(Camera);

        // if (!camera) {
        //     console.error("Camera not found");
        //     return;
        // }

        // // Convert the screen-space touch position to world-space using the camera
        // const worldTouchPos = camera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0));

        // for (const grid of this.grids) {
        //     const rect = grid.getComponent(UITransform).getBoundingBoxToWorld();

        //     // Check if the world touch position is inside the grid's bounding box
        //     if (rect.contains(new Vec2(worldTouchPos.x, worldTouchPos.y))) {
        //         this.dragging = true;

        //         // Get the world position of the current node and calculate the drag offset
        //         const worldPos = this.node.worldPosition;
        //         this.dragOffset = new Vec3(worldPos.x - worldTouchPos.x, worldPos.y - worldTouchPos.y, worldPos.z);

        //         // Emit the blockClicked event
        //         this.blockClicked.emit('blockClicked', this);
        //         break;
        //     }
        // }
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

