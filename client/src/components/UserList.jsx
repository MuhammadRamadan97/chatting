import React from "react";
import './UserList.css';
import md5 from 'blueimp-md5';

const UserList = ({ users, selectedUser, onlineUsers, onSelectUser }) => {


    return (
        <div className="user-list">
            <h3>Contacts</h3>
            <div className="users">
                {users.map(user => {
                    const hash = md5(user.email);
                    const avatarUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon`;

                    return (
                        <div
                            key={user._id}
                            className={`user-item ${selectedUser?._id === user._id ? 'active' : ''}`}
                            onClick={() => onSelectUser(user)}
                        >
                            <div className="user-info">
                                <img src={avatarUrl} alt={user.username} className="avatar" />
                                <p className="username">{user.username}</p>
                                <p className={`status ${onlineUsers.includes(user._id) ? 'online' : 'offline'}`}>
                                    {onlineUsers.includes(user._id) ? '● Online' : '○ Offline'}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default UserList;