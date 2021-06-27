import React from 'react'
import { Box, Button, Flex, Link } from '@chakra-ui/react';
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';

interface NavBarProps {

}

export const NavBar: React.FC<NavBarProps> = ({ }) => {
    const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
    const [{ data, fetching }] = useMeQuery({
        pause: isServer(),
    });
    let body;

    console.log("data", data);

    // data loading
    if (fetching) {

        // user not logged in
    } else if (!data?.me) {
        body = (
            <>
                <NextLink href="/login">
                    <Link color='white' mr="4">Login</Link>
                </NextLink>
                <NextLink href="/register">
                    <Link color='white' mr="4">Register</Link>
                </NextLink>
            </>
        );
    }
    // user logged in
    else {
        body = (
            <Box>
                <Box>
                    {data.me.username}
                    <Button onClick={() => {
                        logout();
                    }}
                        isLoading={logoutFetching}
                        padding={1}
                        mr={2}
                        variant='link'>Logout</Button>
                </Box>
            </Box>
        )
    }

    console.log("cookie being stored?");
    console.log(data?.me);

    return (
        <Flex
            zIndex={1}
            position="sticky"
            top={0}
            p={4}
            bg="teal"
        >
            <Box ml={'auto'}>
                {body}
            </Box>
        </Flex>
    );
}