import React, { useState, useEffect } from 'react';
import { Button, message, Modal, Input, List, Row, Col, Card, Space } from 'antd';
import Web3 from 'web3';
import { BuyMyRoomContract, myERC20Contract, tradeContract, web3 } from '../../utils/contracts';
import Addresses from '../../utils/contract-addresses.json'
import './index.css';
import {type} from "node:os";
import { log } from 'node:console';
import { getBalance } from 'web3/lib/commonjs/eth.exports';
interface House {
    id: number;
    owner: string;
    price: number;
    selling: boolean;
    discription: string;
    listedTimestamp: number;
}

const HomePage: React.FC = () => {
    const [account, setAccount] = useState<string | null>(null);
    const [listHouseId, setListHouseId] = useState<Number | null>(null);
    const [listHousePrice, setListHousePrice] = useState<string>('');
    const [selectedHouseId, setSelectedHouseId] = useState<number | null>(null);
    //IsConfirmModalVisible
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState<boolean>(false);
    const [isListConfirmModalVisible, setIsListConfirmModalVisible] = useState<boolean>(false);
    const [houseInfo, setHouseInfo] = useState<any>(null);
    const [houseList, setHouseList] = useState<House[]>([]);
    const [myHouseList, setMyHouseList] = useState<House[]>([]);
    //Erc20Balance
    const [erc20Balance, setErc20Balance] = useState<number>(0);
    const [ethToChange, setEthToChange] = useState<string>('');
    const [erc20ToChange, setErc20ToChange] = useState<string>('');
    const [ethToChangeResult, setEthToChangeResult] = useState<string>('');
    const [erc20ToChangeResult, setErc20ToChangeResult] = useState<string>('');
    // ethLiquidity
    const [ethLiquidity, setEthLiquidity] = useState<string>('');
    // erc20Liquidity
    const [erc20Liquidity, setErc20Liquidity] = useState<string>('');
    const connectWallet = async() => {
        try {
            // @ts-ignore
            const { ethereum } = window;
            if (!ethereum || !ethereum.isMetaMask) {
                message.error('请安装 MetaMask');
            }
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

            if (accounts && accounts.length > 0) {
                setAccount(accounts[0]);
                message.success(`已连接账户: ${accounts[0]}`);
            } else {
                message.error('连接钱包失败');
            }

        }
        catch (error : any) {
            console.log(`${error.message}`);
        }
    }
    
    const listHouse = async() => {
        if (!account) {
            message.error("请先连接钱包");
            return ;
        }
        console.log(listHouseId);
        if (listHousePrice == null || isNaN(Number(listHousePrice))) {
            message.error("请输入正确的价格");
            return ;
        }
        try {
            console.log(listHouseId);
            console.log(Web3.utils.toWei(Number(listHousePrice), 'wei'));
            await BuyMyRoomContract.methods.listHouse(listHouseId, Web3.utils.toWei(Number(listHousePrice), 'wei')).send({ from: account });
            message.success('成功挂出房子');
            // await getAllHouse();
            setIsListConfirmModalVisible(false);
            setListHouseId(null)
        }
        catch (error : any) {
            message.error(`${error.message}`);
            setIsListConfirmModalVisible(false);
            setListHouseId(null)
        }
    }
    const getAllHouse = async() => {
        try {
            //getallhouse
            const houses = await BuyMyRoomContract.methods.getAllHouse().call() || [];
            // console.log(houses)
            // house info : { id: 1, price: 100, owner: 23423423, selling: false, discrption: 'xxxx' }
            const parsedHouses = houses.map((house: any)=> {
                return {
                    id: house.id,
                    price: house.price,
                    owner: house.owner,
                    selling: house.selling,
                    discription: house.discription,
                    listedTimestamp: house.listedTimestamp
                };}
            )
            // console.log(parsedHouses)
            setHouseList(parsedHouses)
        }
        catch (error : any) {
            message.error(`${error.message}`);
        }
    }

    const getMyHouse = async() => {
        if (!account) {
            message.error('请先连接钱包');
            return;
        }
        
        try {
            const houses = await BuyMyRoomContract.methods.getHouses().call({from: account}) || [];
            console.log(houses)
            // house info : { id: 1, price: 100, owner: 23423423, selling: false, discrption: 'xxxx' }
            const parsedHouses = houses.map((house: any)=> {
                return {
                    id: house.id,
                    price: house.price,
                    owner: house.owner,
                    selling: house.selling,
                    discription: house.discription,
                    listedTimestamp: house.listedTimestamp
                };}
            )
            // console.log(parsedHouses)
            setMyHouseList(parsedHouses)
        } catch (error: any) {
            message.error(`${error.message}`);
        }
    }


    const handlePurchase = async () => {
        if (selectedHouseId !== null && account) {
            try {
                console.log(`Attempting to purchase house ${selectedHouseId} from account ${account}`);
                if (BuyMyRoomContract && myERC20Contract) {
                    try {
                        await myERC20Contract.methods.approve(Addresses.BuyMyRoom, houseInfo.price).send({
                            from: account
                        })
                        // 调用购买房屋的函数
                        const fee = await BuyMyRoomContract.methods.getSellingFee(selectedHouseId).call();
                        await BuyMyRoomContract.methods.buyHouse(selectedHouseId).send({ from: account });
                        message.success(`成功购买房子 ${selectedHouseId}，手续费为${Number(fee)}`);
                        setIsConfirmModalVisible(false);
                        getAllHouse();
                    } catch (error: any) {
                        alert(error.message)
                    }
                }
            } catch (error: unknown) {
                const errorMessage = (error as any).message || (error as Error).message; // 捕捉不同类型的错误
                console.error(error);
                message.error(`${errorMessage}`);
            }
        } else {
            message.error('请确保选择了房子并且已连接账户');
        }
    };

    const handleInputChangePrice = (e: React.ChangeEvent<HTMLInputElement>) => {
        setListHousePrice(e.target.value);
    };


    const checkTokenBalance = async () => {
        if (!account) {
            message.error('请先连接钱包');
            return;
        }

        try {
            const balance = await myERC20Contract.methods.getBalance().call({ from: account });
            setErc20Balance(Number(balance));
        } catch (error: any) {
            message.error(`${error.message}`);
        }
    };

    const releaseNewHouse = async() => {
        if (!account) {
            message.error('请先连接钱包');
            return;
        }
        
        try {
            await BuyMyRoomContract.methods.releaseNewHouse().send({ from: account });
            message.success(`房屋新建成功`)
        } catch (error: any) {
            message.error(`${error.message}`);
        }
    }

    const closeList = async() => {
        setListHouseId(null);
        setListHousePrice('');

        setIsListConfirmModalVisible(false);
    }

    const getExchangeRateEth = async() => {
        try {
            if (ethToChange == null || isNaN(Number(ethToChange)) || Number(ethToChange) <= 0) {
                message.error('请输入有效的金额');
                return;
            }
            const rate = await tradeContract.methods.eTHToErc20Amount(web3.utils.toWei(ethToChange, "wei")).call() as Number;
            setEthToChangeResult(rate.toString());
            console.log(web3.utils.toWei(ethToChange, "wei"));
            message.success(`汇率获取成功`)
        } catch (error: any) {
            message.error(`${error.message}`);
        }
    }

    const getexchangeRateErc20 = async() => {
        try {
            if (erc20ToChange == null || isNaN(Number(erc20ToChange)) || Number(erc20ToChange) <= 0) {
                message.error('请输入有效的金额');
                return;
            }
            const rate = await tradeContract.methods.erc20ToETHAmount(web3.utils.toWei(erc20ToChange, "wei")).call() as Number;
            setErc20ToChangeResult(rate.toString());
            message.success(`汇率获取成功`)
        } catch (error: any) {
            message.error(`${error.message}`);
        }
    }

    const changeErc20 = async() => {
        if (account == null) {
            message.error('请先连接钱包');
            return;
        }
        try {
            if (ethToChange == null || isNaN(Number(ethToChange)) || Number(ethToChange) <= 0) {
                message.error('请输入有效的金额');
                return;
            }
            await tradeContract.methods.ChangeETHtoErc20().send({ from: account, value: web3.utils.toWei(ethToChange,"wei") });
            message.success(`兑换成功`)
        }catch(error : any) {
            message.error(`${error.message}`);
        }
    }

    const changeEth = async() => {
        if (account == null) {
            message.error('请先连接钱包');
            return;
        }
        try {
            if (erc20ToChange == null || isNaN(Number(erc20ToChange)) || Number(erc20ToChange) <= 0) {
                message.error('请输入有效的金额');
                return;
            }
            await myERC20Contract.methods.approve(Addresses.Trade, Number(erc20ToChange)).send({ from: account });
            await tradeContract.methods.ChangeErc20toETH(web3.utils.toWei(erc20ToChange, "wei")).send({ from: account });
            message.success(`兑换成功`)
        }catch(error : any) {
            message.error(`${error.message}`);
        }
    }

    const addLiquidity = async() => {
        if (account == null) {  
            message.error('请先连接钱包');
            return;
        }
        try {
            if (ethLiquidity == null || isNaN(Number(ethLiquidity)) || Number(ethLiquidity) <= 0) {
                message.error('请输入有效的金额');
                return;
            }
            if (erc20Liquidity == null || isNaN(Number(erc20Liquidity)) || Number(erc20Liquidity) <= 0) {
                message.error('请输入有效的金额');
                return;
            }
            await myERC20Contract.methods.approve(Addresses.Trade, Number(erc20Liquidity)).send({ from: account });
            await tradeContract.methods.addLiquidity(web3.utils.toWei(erc20Liquidity, "wei")).send({ from: account, value: web3.utils.toWei(ethLiquidity, "wei") });
            message.success(`注入流动性成功`)
        }
        catch(error : any) {
            message.error(`注入流动性失败: ${error.message}`);
        }

    }
    

    return (
        <div className="container">
            <div className="main">
                {/* 显示账户信息 */}
                <Space direction="vertical">
                    <h1>BuyMyRoom</h1>
                </Space>

                <Card title="账户信息" bordered={false} className="account-card">
                <div className="account-info">
                        <Button onClick={connectWallet}>
                            连接钱包
                        </Button>
                    {account ? (
                        <div className="account-address">当前用户：{account}</div>
                    ) : (<div className="account-address">未登录</div>)}
                </div>
                </Card>

                <Card title="代币兑换" bordered={false} className="exchange-card">
                    <Row gutter={[16, 16]}>
                        <Col>
                            <Button onClick={checkTokenBalance}>刷新余额</Button>
                        </Col>
                        <Col>
                            <div className="erc20-balance"> 我的 ERC20 代币余额:{erc20Balance}</div>
                        </Col>
                    </Row>
                    <div className="erc20-balance"> </div>
                    
                    <Row gutter={[16, 16]}>
                        <Col span={8}>
                            <Input placeholder="需注入的ETH数量(in Wei)" value={ethLiquidity} onChange={(e) => setEthLiquidity(e.target.value)} />
                        </Col>
                        <Col span={8}>
                            <Input placeholder="需注入的ERC20数量(in Wei)" value={erc20Liquidity} onChange={(e) => setErc20Liquidity(e.target.value)} />
                        </Col>
                        <Col span={8}>
                            <Button onClick={addLiquidity} block>
                                注入流动性
                            </Button>
                        </Col>
                    </Row>
                    <div className="erc20-balance"> </div>

                    <Row gutter={[16, 16]}>
                        <Col span={8}>
                            <Input placeholder="需兑换的ETH数量(in Wei)" value={ethToChange} onChange={(e) => setEthToChange(e.target.value)} />
                        </Col>
                        <Col span={8}>
                            <Button onClick={getExchangeRateEth} block>
                                查询汇率
                            </Button>
                        </Col>
                        <Col span={8}>
                            <Button onClick={changeErc20} block>
                                兑换ERC20
                            </Button>
                        </Col>
                    </Row>
                    <div className="erc20-exchange">当前可兑换ERC20: {ethToChangeResult}</div>

                    <Row gutter={[16, 16]}>
                        <Col span={8}>
                            <Input placeholder="需兑换的Erc20数量" value={erc20ToChange} onChange={(e) => setErc20ToChange(e.target.value)} />
                        </Col>
                        <Col span={8}>
                            <Button onClick={getexchangeRateErc20} block>
                                查询汇率
                            </Button>
                        </Col>
                        <Col span={8}>
                            <Button onClick={changeEth} block>
                                兑换ETH
                            </Button>
                        </Col>
                    </Row>
                    <div className="erc20-exchange">当前可兑换ETH: {erc20ToChangeResult}</div>
                </Card>


                <Card title="查看我的房子" bordered={false} className="for-sale-houses-card" >
                    <Row gutter={[16, 16]}>
                    <Col>
                        <Button onClick={getMyHouse}>
                        查看我的房子
                        </Button>
                    </Col>
                    
                    <Col>
                        <Button onClick={releaseNewHouse}>
                            新建房子
                        </Button>
                    </Col>
                    </Row>
                    <List
                        grid={{ gutter: 16, column: 3 }}
                        dataSource={myHouseList}
                        renderItem={(houseitem : House) => (
                            <List.Item>
                                <Card>
                                    房子 ID：{houseitem.id.toString()} <br />
                                    房子价格：{houseitem.price.toString()}<br />
                                    是否挂出：{houseitem.selling ? '是' : '否'}<br />
                                    房屋描述：{houseitem.discription}<br />
                                    挂出时间：{houseitem.listedTimestamp.toString()}<br />
                                    {/*
                                    list this house item
                                    */}
                                    <Button onClick={() => {
                                        setListHouseId(houseitem.id);
                                        if (houseitem.selling == true) {
                                            message.error('该房子已经挂出');
                                        }
                                        else 
                                            setIsListConfirmModalVisible(true);
                                    }} block>
                                        挂出
                                    </Button>
                                </Card>
                            </List.Item>
                        )}
                    />
                </Card>

                {/* 我的房子 */}
                <Card title="查看所有挂出的房子" bordered={false} className="for-sale-houses-card">
                    <Button onClick={getAllHouse}>
                        查看所有挂出的房子
                    </Button>
                    <List
                        grid={{ gutter: 16, column: 3 }}
                        dataSource={houseList}
                        renderItem={(houseitem : House) => (
                            <List.Item>
                                <Card>
                                    房子 ID：{houseitem.id.toString()} <br />
                                    房子价格：{houseitem.price.toString()}<br />
                                    房主: {houseitem.owner.substring(0,10) + "..."}<br />
                                    房屋描述：{houseitem.discription}<br />
                                    挂出时间：{houseitem.listedTimestamp.toString()}<br />
                                    <Button onClick={() => {
                                        setSelectedHouseId(houseitem.id);
                                        checkTokenBalance();
                                        if (houseitem.owner === account) {
                                            message.error('不能购买自己的房子');
                                        }
                                        else if (houseitem.price >= erc20Balance) {
                                            message.error('余额不足');
                                        }
                                        else {
                                            setHouseInfo(houseitem);
                                            setIsConfirmModalVisible(true);
                                        }
                                    }} block>
                                        购买
                                    </Button>
                                </Card>
                            </List.Item>
                        )}
                    />
                </Card>

                {/* 弹窗 */}

                <Modal title="确认挂出" visible={isListConfirmModalVisible} onOk={listHouse} onCancel={closeList}>
                    <Input placeholder="请输入挂出价格" value={listHousePrice} onChange={handleInputChangePrice} />
                </Modal>


                <Modal title="确认购买" visible={isConfirmModalVisible} onOk={handlePurchase} onCancel={() => setIsConfirmModalVisible(false)} okText="确认购买" cancelText="取消">
                    <p>你确定要购买吗？</p>
                </Modal>
            </div>
        </div>
    );


};
export default HomePage;