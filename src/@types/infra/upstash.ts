export interface UpstashConfig {
  token: string;
  clusterId: string;
}

export interface KafkaTopicDetails {
  topic_id: string;
  topic_name: string;
  cluster_id: string;
  region: string;
  creation_time: number;
  state: string;
  partitions: number;
  multizone: boolean;
  tcp_endpoint: string;
  rest_endpoint: string;
  username: string;
  password: string;
  cleanup_policy: string;
  retention_size: number;
  retention_time: number;
  max_message_size: number;
}
