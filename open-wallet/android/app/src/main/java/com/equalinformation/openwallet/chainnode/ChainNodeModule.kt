package com.equalinformation.openwallet.chainnode

import com.facebook.react.bridge.*
import mobile.Mobile
import kotlinx.coroutines.*

/**
 * React Native Native Module — bridges Open Chain's gomobile library to JavaScript.
 *
 * Exposes: startNode, stopNode, getNodeStatus, broadcastTransaction, getBalance
 * All calls are async and run on background threads.
 */
class ChainNodeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "OpenChainNode"

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    @ReactMethod
    fun startNode(configJSON: String, promise: Promise) {
        scope.launch {
            try {
                val peerId = Mobile.startNode(configJSON)
                promise.resolve(peerId)
            } catch (e: Exception) {
                promise.reject("CHAIN_START_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun stopNode(promise: Promise) {
        scope.launch {
            try {
                Mobile.stopNode()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("CHAIN_STOP_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getNodeStatus(promise: Promise) {
        scope.launch {
            try {
                val status = Mobile.getNodeStatus()
                promise.resolve(status)
            } catch (e: Exception) {
                promise.reject("CHAIN_STATUS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getPeers(promise: Promise) {
        scope.launch {
            try {
                val peers = Mobile.getPeers()
                promise.resolve(peers)
            } catch (e: Exception) {
                promise.reject("CHAIN_PEERS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun broadcastTransaction(txHex: String, promise: Promise) {
        scope.launch {
            try {
                Mobile.broadcastTransaction(txHex)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("CHAIN_TX_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getBalance(address: String, promise: Promise) {
        scope.launch {
            try {
                val balance = Mobile.getBalance(address)
                promise.resolve(balance)
            } catch (e: Exception) {
                promise.reject("CHAIN_BALANCE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun isValidator(promise: Promise) {
        try {
            val isVal = Mobile.isValidator()
            promise.resolve(isVal)
        } catch (e: Exception) {
            promise.reject("CHAIN_VALIDATOR_ERROR", e.message, e)
        }
    }
}
