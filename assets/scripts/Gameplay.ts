import { _decorator, AudioSource, Button, screen, Component, instantiate, Label, Node, Prefab, Sprite, sys, tween, Tween, Vec3, view, macro, Vec2, log, Camera, Canvas } from 'cc';
import { Board } from './Board';
import { Block } from './Block';
import { GridCell } from './GridCell';
import { BlockCell } from './BlockCell';
const { ccclass, property } = _decorator;

@ccclass('Gameplay')
export class Gameplay extends Component {
    @property(Camera)
    public camera: Camera;
    @property(Board) 
    public board: Board;
    @property(Block)
    public blocks: Block[] = [];
    @property(Block)
    public newBlocks: Block[] = [];
    @property(Block)
    public tutorialBlock : Block;
    @property(Label)
    public pointLabel: Label;
    @property(Node)
    public winScreen: Node;
    @property(Node)
    public download_button: Node;
    @property(Node) 
    public home_download_button: Node;
    @property
    public timer: number = 10;

    @property(Node) canvas: Node;
    @property(Node) streak_2: Node;
    @property(Node) streak_3: Node;
    @property(Node) streak_4: Node;
    @property(Node) streak_5: Node;
    @property(Button) tutorialScreen: Button;
    @property(Vec3)
    public tutorialPosition: Vec3 = new Vec3(0, 0, 0);
    @property
    public url : string = "";
    
    @property(AudioSource) bgm: AudioSource;
    @property(AudioSource) placeSFX: AudioSource;
    @property(AudioSource) winSFX: AudioSource;

    @property(Block)
    currentBlock: Block | null = null;
    cellsToRemove: GridCell[] = [];
    point: number = 0;
    time: number;
    streak: number = 0;
    @property isTutorial: boolean = true;
    isVfx: boolean = false;
    tutorialTween: Tween<Node> | null = null;
    tutorialHand: Node;

    private isPortrait: boolean = false;

    onLoad() {
        screen.on('orientation-change', this.onOrientationChange, this);
        screen.on('window-resize', this.onWindowResize, this);
    }
    
    start() {

        const gameDataDiv = document.getElementById('game-data');

        if (gameDataDiv) {

            this.url = gameDataDiv.getAttribute('url-data');

            console.log(this.url);

        } else {
            console.error('Game data div not found!');
        }
        

        this.blocks.forEach(block => {
            block.blockPlaced.on('blockPlaced', this.onBlockPlaced, this);
            block.blockClicked.on('blockClicked', this.onBlockClicked, this);
            block.blockReleased.on('blockReleased', this.onBlockReleased, this);
        })

        this.updatePoint();

        if (this.isTutorial) {
            this.tutorialScreen.node.active = true;
            this.tutorialHand = this.tutorialBlock.node.getChildByName('Hand');
            this.tutorialHand.active = true;
            this.tutorialTween = tween(this.tutorialBlock.node).repeatForever(
                tween(this.tutorialBlock.node)
                .set({ position: this.tutorialBlock.initPosition })
                .to(1, { position: this.tutorialPosition })
                .delay(1)
                .set({ position: this.tutorialBlock.initPosition })
                .to(1, { position: this.tutorialPosition })
                .delay(1)
            ).start();
        }

    }

    onOrientationChange(orientation: number) {
        if (orientation === macro.ORIENTATION_LANDSCAPE_LEFT || orientation === macro.ORIENTATION_LANDSCAPE_RIGHT) {
            this.onLandscape();
        } 
        else {
            this.onPortrait();
        }
    }

    onWindowResize(width: number, height: number) {
        if (width > height) {
            this.onLandscape();
        }
        else {
            this.onPortrait();
        }
    }

    onPortrait() {
        this.isPortrait = true;
        this.blocks.forEach(block => {
            block.initPosition = block.portraitPosition;
            block.node.position = block.initPosition;
        })

        //this.canvas.getComponent(Canvas).alignCanvasWithScreen = true;
    }

    onLandscape() {
        this.isPortrait = false;
        this.blocks.forEach(block => {
            block.initPosition = block.landscapePosition;
            block.node.position = block.initPosition;
        })
        this.canvas.getComponent(Canvas).alignCanvasWithScreen = false;
        this.camera.orthoHeight = 500;
        
    }

    update(deltaTime: number) {
        if (!this.isTutorial) {
            this.updateTime(deltaTime); 
        }
           
        if (this.currentBlock != null && this.currentBlock.dragging) {
            var first : BlockCell = this.currentBlock.grids[0];
            var first_position : Vec3 = first.node.worldPosition;
            var overlap_grid_cells : GridCell[] = this.board.grids.filter((x) => Vec3.distance(x.node.worldPosition, first_position) < 25);
            overlap_grid_cells = overlap_grid_cells.filter((x) => x.state == GridCell.STATE.EMPTY || x.state == GridCell.STATE.HOVERED);
            if (overlap_grid_cells.length > 0) {
                overlap_grid_cells.sort((a, b) => {
                    if (Vec3.distance(a.node.worldPosition, first_position) < Vec3.distance(b.node.worldPosition, first_position)) {
                        return -1;
                    }
                    if (Vec3.distance(a.node.worldPosition, first_position) > Vec3.distance(b.node.worldPosition, first_position)) {
                        return 1;
                    }
                    return 0; 
                });
                first.setGridCell(overlap_grid_cells[0]);
                
                for (let i = 1; i < this.currentBlock.grids.length; i++) {
                    let block_cell = this.currentBlock.grids[i];
                    let grid_cell_coord = overlap_grid_cells[0].coordinate.clone().add(block_cell.coordinate);
                    if (grid_cell_coord.x < this.board.boardSize && grid_cell_coord.y < this.board.boardSize) {
                        let grid_cell = this.board.grids[grid_cell_coord.y * this.board.boardSize + grid_cell_coord.x];
                        if (grid_cell.state == GridCell.STATE.EMPTY) {
                            block_cell.setGridCell(grid_cell);
                        }
                    }
                }

                if (this.currentBlock.canPlace()) {
                    this.getCellsToRemove();
                }
                else {
                    this.clearCellsToRemove();
                }
            }
            else {
                this.clearCellsToRemove();
            }
        }
    }

    onBlockClicked(block: Block) {
        if (!this.isVfx) {
            this.currentBlock = block;
        }         
    }

    async onBlockPlaced(block: Block, combo: Prefab, position: Vec3, name: string) {
        this.placeSFX.play();
        this.blocks = this.blocks.filter(b => b !== block);
        block.node.active = false;
        
        if (this.cellsToRemove.length > 0) {
            
            await this.updateCells();

            this.cellsToRemove = [];
            
            this.updateStreak();
            this.showCombo(block, combo, position, name);
        }

        this.spawnNewBlock(block);

        if (this.blocks.length <= 0) {
            setTimeout(() => {
                this.winScreen.active = true;
                this.winSFX.play();
            }, 1000);
        }

        block.node.destroy();
    }

    spawnNewBlock(oldBlock: Block) {
        var block : Block = this.newBlocks.pop();
        if (block == undefined) {
            return;
        }
        
        block.node.position = oldBlock.initPosition;
        block.initPosition = oldBlock.initPosition;
        this.blocks.push(block);
        block.blockPlaced.on('blockPlaced', this.onBlockPlaced, this);
        block.blockClicked.on('blockClicked', this.onBlockClicked, this);
        block.blockReleased.on('blockReleased', this.onBlockReleased, this);
        block.node.active = true;
        
    }

    async updateCells() {
        this.isVfx = true;
        for (const cell of this.cellsToRemove) {
            await new Promise(resolve => setTimeout(resolve, 20));
            cell.vfx.enabled = true;
            cell.sprite.spriteFrame = cell.emptyTexture;
            cell.state = GridCell.STATE.EMPTY;
            this.point += 100;
            this.updatePoint();
        }
        this.isVfx = false;
    }

    onBlockReleased(block: Block) {
        this.clearCellsToRemove();
    }

    getCellsToRemove() {
        this.cellsToRemove = [];
        this.currentBlock.getXCoord();
        this.currentBlock.getYCoord();
        for (let y of this.currentBlock.yCoord) {
            var cells = this.board.grids.filter(x => x.coordinate.y == y && x.state != GridCell.STATE.EMPTY);
            if (cells.length != this.board.boardSize) {
                continue;
            }
            for (let cell of cells) {
                if (this.cellsToRemove.indexOf(cell) === -1) {
                    this.cellsToRemove.push(cell);
                    cell.sprite.spriteFrame = this.currentBlock.grids[0].sprite.spriteFrame;
                }
            }
        }
        for (let x of this.currentBlock.xCoord) {
            var cells = this.board.grids.filter(n => n.coordinate.x == x && n.state != GridCell.STATE.EMPTY);
            if (cells.length != this.board.boardSize) {
                continue;
            }
            cells.forEach(cell => {
                if (this.cellsToRemove.indexOf(cell) === -1) {
                    this.cellsToRemove.push(cell);
                    cell.sprite.spriteFrame = this.currentBlock.grids[0].sprite.spriteFrame;
                }
            })
        }
    }

    clearCellsToRemove() {
        this.cellsToRemove.forEach(cell => {
            cell.sprite.spriteFrame = cell.initTexture;
        })
        this.cellsToRemove = [];
    }

    updateTime(delta: number) {
        this.timer -= delta
	    if (this.timer <= 0 && this.winScreen.active == false) {
            this.winScreen.active = true;
            this.winSFX.play()
        }
		
    }

    updatePoint() {
        this.pointLabel.string = this.point.toString();
    }

    updateStreak() {
        this.streak += 1
        if (this.streak == 2) {
            this.streak_2.active = true;
            setTimeout(() => {
                this.streak_2.active = false;
            }, 1000)
        }
        else if (this.streak == 3) {
            this.streak_3.active = true;
            setTimeout(() => {
                this.streak_3.active = false;
            }, 1000)
        }
        else if (this.streak == 4) {
            this.streak_4.active = true;
            setTimeout(() => {
                this.streak_4.active = false;
            }, 1000)
        }
        else if (this.streak == 5) {
            this.streak_5.active = true;
            setTimeout(() => {
                this.streak_5.active = false;
            }, 1000)
        }
    }

    showCombo(block: Block, _combo: Prefab, _position: Vec3, name : string) {
        const combo = instantiate(_combo);
        
        // Add the combo to the canvas
        this.canvas.addChild(combo);
        
        combo.position = _position;
        if (name == "Block-001" || name == "Block-003") {
            combo.position = new Vec3(combo.position.x + 120, combo.position.y, combo.position.z);
        }
        
        tween(combo)
            .to(0.3, { scale: new Vec3(1.2, 1.2, 1.2) })
            .start();

        // combo.children.forEach(child => {
        //     tween(child.getComponent(Sprite))
        //         .to(0.3, { color: new Color(255, 255, 255, 0) })
        //         .start();de
        // });

        // Remove the combo from the scene after the tween completes
        this.scheduleOnce(() => {
            combo.destroy();
        }, 0.4);
    }

    onTutorialScreenTouched() {
        this.tutorialScreen.node.active = false;
        this.tutorialTween.stop();
        this.tutorialHand.destroy();
        this.tutorialBlock.node.position = this.tutorialBlock.initPosition;
        this.isTutorial = false;
        this.bgm.play();
    }

    onDownloadButtonClicked() {
        sys.openURL(this.url);
    }

    onHomeDownloadButtonClicked() {
        sys.openURL(this.url);
    }
}

