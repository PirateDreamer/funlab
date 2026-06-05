package config

import (
	"fmt"
	"log/slog"
	"sync"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"
)

type Config struct {
	mu                sync.RWMutex
	raw               *viper.Viper
	onChangeCallbacks []func(*Config)

	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	CORS     CORSConfig     `mapstructure:"cors"`
	Log      LogConfig      `mapstructure:"log"`
}

type ServerConfig struct {
	Host string `mapstructure:"host"`
	Port int    `mapstructure:"port"`
	Mode string `mapstructure:"mode"`
}

type DatabaseConfig struct {
	Host            string `mapstructure:"host"`
	Port            int    `mapstructure:"port"`
	Username        string `mapstructure:"username"`
	Password        string `mapstructure:"password"`
	DBName          string `mapstructure:"dbname"`
	Charset         string `mapstructure:"charset"`
	MaxIdleConns    int    `mapstructure:"max_idle_conns"`
	MaxOpenConns    int    `mapstructure:"max_open_conns"`
	ConnMaxLifetime int    `mapstructure:"conn_max_lifetime"`
}

type CORSConfig struct {
	AllowOrigins []string `mapstructure:"allow_origins"`
	AllowMethods []string `mapstructure:"allow_methods"`
	AllowHeaders []string `mapstructure:"allow_headers"`
	MaxAge       int      `mapstructure:"max_age"`
}

type LogConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"`
}

func Load(path string) (*Config, error) {
	v := viper.New()
	v.SetConfigFile(path)
	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("read config: %w", err)
	}
	cfg := &Config{raw: v}
	cfg.unmarshal()
	cfg.watch()
	return cfg, nil
}

func (c *Config) unmarshal() {
	_ = c.raw.Unmarshal(c)
}

func (c *Config) watch() {
	c.raw.WatchConfig()
	c.raw.OnConfigChange(func(e fsnotify.Event) {
		c.mu.Lock()
		c.unmarshal()
		slog.Info("config reloaded", "file", e.Name)
		callbacks := make([]func(*Config), len(c.onChangeCallbacks))
		copy(callbacks, c.onChangeCallbacks)
		c.mu.Unlock()

		for _, cb := range callbacks {
			go cb(c)
		}
	})
}

func (c *Config) OnChange(fn func(*Config)) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.onChangeCallbacks = append(c.onChangeCallbacks, fn)
}

func (c *Config) GetServer() ServerConfig {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.Server
}

func (c *Config) GetDatabase() DatabaseConfig {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.Database
}

func (c *Config) GetCORS() CORSConfig {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.CORS
}

func (c *Config) GetLog() LogConfig {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.Log
}

func (c *Config) DSN() string {
	d := c.GetDatabase()
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local",
		d.Username, d.Password, d.Host, d.Port, d.DBName, d.Charset)
}
