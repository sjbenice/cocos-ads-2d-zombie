import { _decorator, Component, instantiate, Animation, Prefab, UITransform, Vec3, randomRange, Node, Size, randomRangeInt } from 'cc';
import { GunController } from '../controller/GunController';
import { SoundMgr } from '../library/manager/SoundMgr';
import event_html_playable, { super_html_playable } from '../library/event_html_playable';
const { ccclass, property } = _decorator;

@ccclass('ZombieMgr')
export class ZombieMgr extends Component {
    @property(Prefab)
    zombiePrefab:Prefab = null;

    @property
    isFixed:boolean = true;

    @property
    startY:number = 0;

    @property(Prefab)
    vfxExplosion:Prefab = null;

    @property(Node)
    vfxPos:Node = null;

    @property(GunController)
    gun:GunController = null;

    @property(Node)
    toggleNodes:Node[] = [];

    @property(Node)
    packshotMgr:Node = null;

    protected static _moveTime:number = 1;
    protected static _killTime:number = 0.9;

    protected _moveSpeed:number = 1;
    protected _addTimer:number = 0;
    protected _killInterval:number = 1;
    protected _killTimer:number = 0;

    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _yOffsets:number[] = [];

    protected _uiDimen:UITransform = null;
    protected _zombieDimen:Size = Size.ZERO.clone();
    protected _rows:number = 0;
    protected _cols:number = 0;

    protected static _dangeCount:number = 0;
    protected _dangeLimitY:number = 0;

    public static getDangeCount() : number {
        return ZombieMgr._dangeCount;
    }

    start() {
        this._uiDimen = this.getComponent(UITransform);

        if (this.zombiePrefab) {
            let zombie = instantiate(this.zombiePrefab);
            this._zombieDimen.width = zombie.getComponent(UITransform).width;
            this._zombieDimen.height = zombie.getComponent(UITransform).height;
            zombie.destroy();

            this._cols = Math.floor(this._uiDimen.width / this._zombieDimen.width);
            this._rows = Math.floor(this._uiDimen.height / this._zombieDimen.height);

            for (let index = 0; index < this._cols; index++) {
                this._yOffsets.push(randomRange(-0.2, 0.2) * this._zombieDimen.height);
            }

            this._moveSpeed = this._zombieDimen.height / ZombieMgr._moveTime;
            this._killInterval = ZombieMgr._killTime / this._cols;

            for (let row = 0; row < this._rows - this.startY; row++) {
                for (let col = 0; col < this._cols; col++) {
                    this.addZombie(row, col, -1);
                }
            }
        }

        this._dangeLimitY = -this._uiDimen.height / 2 + this._zombieDimen.height * 2;
    }

    protected addZombie(row:number, col:number, index:number) {
        this._tempPos.x = -this._uiDimen.width / 2 + this._zombieDimen.width * col + this._zombieDimen.width / 2;
        this._tempPos.y = this._uiDimen.height / 2 - this._zombieDimen.height * row - this._zombieDimen.height / 2 + this._yOffsets[col];

        const zombie = instantiate(this.zombiePrefab);

        if (index >= 0)
            this.node.insertChild(zombie, index);
        else
            this.node.addChild(zombie);

        zombie.setPosition(this._tempPos);

        const anim = zombie.getComponentInChildren(Animation);
        if (anim) {
            this.schedule(()=>{
                anim.play();
            }, randomRange(0.2, 0.5));
        }
    }

    protected killZombie(zombie:Node) {
        if (this.inDangeRegion(zombie))
            ZombieMgr._dangeCount --;

        zombie.getWorldPosition(this._tempPos);
    
        zombie.setParent(this.vfxPos);
        zombie.setWorldPosition(this._tempPos);
        const anim = zombie.getComponentInChildren(Animation);
        if (anim) {
            anim.defaultClip = anim.clips[1];//'zombie_kill';
            anim.play();
        }

        if (this.vfxExplosion) {
            const vfx = instantiate(this.vfxExplosion);
            this.vfxPos.addChild(vfx);
            vfx.setWorldPosition(this._tempPos);
            this.scheduleOnce(() => {
                vfx.removeFromParent();
                vfx.destroy();

                zombie.removeFromParent();
                zombie.destroy();
            }, 0.5);
        }
    }

    update(deltaTime: number) {
        if (!this.isFixed && (this.gun && this.gun.node.activeInHierarchy || this.toggleNodes[0].active)) {
            const moveDelta = this._moveSpeed * deltaTime;

            for (let index = this.node.children.length - 1; index >= 0; index--) {
                const node = this.node.children[index];
                const isPrevPosDange = this.inDangeRegion(node);

                if (isPrevPosDange && this.gun && this.gun.node.activeInHierarchy) {
                    this.killZombie(node);
                } else {
                    node.getPosition(this._tempPos);
                    this._tempPos.y -= moveDelta;
                    node.setPosition(this._tempPos);
    
                    if (!isPrevPosDange && this.inDangeRegion(node))
                        ZombieMgr._dangeCount ++;
                }

            }

            if (this.gun && this.gun.node.activeInHierarchy && this.node.children.length > 0) {
                if (this._killTimer == 0) {
                    const zombie = this.node.children[this.node.children.length - 1];
                    zombie.getWorldPosition(this._tempPos);

                    this.gun.fire(this._tempPos, this._killInterval);
                }

                this._killTimer += deltaTime;
                if (this._killTimer >= this._killInterval) {
                    this._killTimer = 0;
                    this.killZombie(this.node.children[this.node.children.length - 1/* - randomRangeInt(0, this._cols)*/]);
                }
            }

            this._addTimer += deltaTime;
            if (this._addTimer >= ZombieMgr._moveTime) {
                this._addTimer = 0;

                for (let col = 0; col < this._cols; col++) {
                    this.addZombie(0, col, 0);
                }
            }
        }
    }

    protected inDangeRegion(node:Node) : boolean {
        return node.position.y < this._dangeLimitY;
    }

    public onBtnPlusGun() {
        this.toggleNodes.forEach(node => {
            node.active =  !node.active;
        });

        SoundMgr.onFirstClick();
        SoundMgr.playSound('upgrade');

        if (this.packshotMgr && event_html_playable.version() == 2) {
            this.packshotMgr.active = true;
        }
    }
}


