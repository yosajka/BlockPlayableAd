import { _decorator, Color, Component, Node, Sprite, Vec2 } from 'cc';
import { GridCell } from './GridCell';
const { ccclass, property } = _decorator;

@ccclass('BlockCell')
export class BlockCell extends Component {
    @property(Vec2)
    coordinate: Vec2 = new Vec2();

    public gridCell: GridCell | null = null;
    public sprite: Sprite | null = null;

    start() {
        this.sprite = this.getComponent(Sprite);
    }

    update(deltaTime: number) {
        if (this.gridCell != null) {
            const distance = Vec2.distance(this.node.getWorldPosition(), this.gridCell.node.getWorldPosition());
            if (distance > 50) {
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
}

