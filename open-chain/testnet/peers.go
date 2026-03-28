package testnet

import "fmt"

// GeneratePeerConfig creates the persistent_peers string for config.toml.
// Format: "nodeID@ip:port,nodeID@ip:port,..."
// Uses placeholder IPs that should be replaced during actual deployment.
func GeneratePeerConfig(validators []ValidatorInfo) string {
	peers := ""
	for i, val := range validators {
		if i > 0 {
			peers += ","
		}
		// Use placeholder IP — will be filled in during actual phone testing
		peers += fmt.Sprintf("%s@<phone-%d-ip>:%d", val.NodeID, i, val.P2PPort)
	}
	return peers
}

// GeneratePhoneConfig creates config for a specific phone.
// phoneIP is the actual IP address of the phone running this validator.
func GeneratePhoneConfig(validator ValidatorInfo, allValidators []ValidatorInfo, phoneIP string) map[string]string {
	// Build peers list excluding this validator
	peers := ""
	for _, val := range allValidators {
		if val.NodeID == validator.NodeID {
			continue
		}
		if peers != "" {
			peers += ","
		}
		// Other nodes use placeholder IPs until configured
		peers += fmt.Sprintf("%s@<pending>:%d", val.NodeID, val.P2PPort)
	}

	config := map[string]string{
		"moniker":          validator.Name,
		"node_id":          validator.NodeID,
		"p2p_listen_addr":  fmt.Sprintf("tcp://%s:%d", phoneIP, validator.P2PPort),
		"rpc_listen_addr":  fmt.Sprintf("tcp://%s:%d", phoneIP, validator.RPCPort),
		"persistent_peers": peers,
		"chain_id":         "openchain-testnet-1",
		"phone_ip":         phoneIP,
	}

	return config
}

// GeneratePeerConfigWithIPs creates a persistent_peers string with actual IPs.
// ips must have the same length as validators.
func GeneratePeerConfigWithIPs(validators []ValidatorInfo, ips []string) (string, error) {
	if len(validators) != len(ips) {
		return "", fmt.Errorf("validator count (%d) != IP count (%d)", len(validators), len(ips))
	}

	peers := ""
	for i, val := range validators {
		if i > 0 {
			peers += ","
		}
		peers += fmt.Sprintf("%s@%s:%d", val.NodeID, ips[i], val.P2PPort)
	}
	return peers, nil
}
